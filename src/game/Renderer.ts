import { Position, GameState, Particle, GameSettings } from './types';
import { Snake } from './Snake';
import { Food } from './Food';
import { GRID_CELLS } from './constants';
import { Storage } from './Storage';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private cellSize = 0;
  private particles: Particle[] = [];
  private pulseTime = 0;
  private settings: GameSettings;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not acquire 2D context from canvas');
    }
    this.ctx = context;
    this.settings = {
      soundEnabled: Storage.getSoundPreference(),
      reducedMotion: Storage.getReducedMotionPreference()
    };
    this.resize();
  }

  public updateSettings(settings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  public resize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    // Get the bounding box of the parent container
    const size = Math.min(parent.clientWidth, parent.clientHeight, 600);

    // Scale canvas by devicePixelRatio for crisp rendering
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * this.dpr;
    this.canvas.height = size * this.dpr;

    // Set styling dimensions
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;

    // Compute active cell size based on pixel grid spacing
    this.cellSize = (size * this.dpr) / GRID_CELLS;
    
    // Scale coordinate system to match canvas coordinates
    this.ctx.restore();
    this.ctx.save();
  }

  public clear(): void {
    this.ctx.fillStyle = '#050507';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Spawns particle explosion at the eaten food location
   */
  public spawnParticles(gridPos: Position, color: string): void {
    if (this.settings.reducedMotion) return;

    const count = 16;
    // Map grid space coordinate to canvas screen pixels
    const centerX = gridPos.x * this.cellSize + this.cellSize / 2;
    const centerY = gridPos.y * this.cellSize + this.cellSize / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed * this.dpr,
        vy: Math.sin(angle) * speed * this.dpr,
        color,
        alpha: 1,
        size: (2 + Math.random() * 3) * this.dpr,
        life: 0,
        maxLife: 25 + Math.floor(Math.random() * 15) // ticks
      });
    }
  }

  public updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p) continue;
      
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95; // Friction
      p.vy *= 0.95;
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private drawParticles(): void {
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  private drawRoundedRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= GRID_CELLS; i++) {
      const pos = i * this.cellSize;
      
      // Vertical lines
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, this.canvas.height);
      this.ctx.stroke();

      // Horizontal lines
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(this.canvas.width, pos);
      this.ctx.stroke();
    }
  }

  private drawSnake(snake: Snake): void {
    const body = snake.getBody();
    const direction = snake.getDirection();
    const gap = 1.5 * this.dpr; // Small gap between cells
    const radius = 3 * this.dpr; // Soft corner radius

    body.forEach((segment, index) => {
      const isHead = index === 0;
      
      // Calculate drawing dimensions with cell gap
      const x = segment.x * this.cellSize + gap;
      const y = segment.y * this.cellSize + gap;
      const size = this.cellSize - gap * 2;

      // Color styling: Head is bright white, body has a soft gradient trailing off
      let fillStyle = '#ffffff';
      if (!isHead) {
        // Calculate decay factor based on snake length
        const decay = Math.min(index / 15, 0.6);
        const brightness = Math.floor(229 - decay * 120); // Fade from off-white (#e5e5ea) to mid-gray
        fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + 4})`; // Keep blue value slightly higher for cool gray
      }

      this.ctx.fillStyle = fillStyle;
      this.drawRoundedRect(x, y, size, size, radius);
      this.ctx.fill();

      // Draw eyes on the head based on movement direction
      if (isHead) {
        this.ctx.fillStyle = '#050507';
        const eyeSize = 2 * this.dpr;
        const eyeOffset = 4 * this.dpr;

        let eye1X = 0, eye1Y = 0, eye2X = 0, eye2Y = 0;

        switch (direction) {
          case 'UP':
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + size - eyeOffset - eyeSize;
            eye2Y = y + eyeOffset;
            break;
          case 'DOWN':
            eye1X = x + eyeOffset;
            eye1Y = y + size - eyeOffset - eyeSize;
            eye2X = x + size - eyeOffset - eyeSize;
            eye2Y = y + size - eyeOffset - eyeSize;
            break;
          case 'LEFT':
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + eyeOffset;
            eye2Y = y + size - eyeOffset - eyeSize;
            break;
          case 'RIGHT':
            eye1X = x + size - eyeOffset - eyeSize;
            eye1Y = y + eyeOffset;
            eye2X = x + size - eyeOffset - eyeSize;
            eye2Y = y + size - eyeOffset - eyeSize;
            break;
        }

        this.ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
        this.ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
      }
    });
  }

  private drawFood(food: Food): void {
    const pos = food.getPosition();
    const gap = 1 * this.dpr;
    const x = pos.x * this.cellSize + gap;
    const y = pos.y * this.cellSize + gap;
    const size = this.cellSize - gap * 2;
    const radius = 2 * this.dpr;

    this.ctx.save();

    // Pulse factor based on time (oscillate between 0.8 and 1.2 scale)
    let pulse = 1.0;
    if (!this.settings.reducedMotion) {
      pulse = 0.9 + Math.sin(this.pulseTime * 0.15) * 0.1;
    }

    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const drawSize = size * pulse;

    // Draw glowing shadow background for food
    if (!this.settings.reducedMotion) {
      this.ctx.shadowColor = 'rgba(255, 59, 48, 0.6)';
      this.ctx.shadowBlur = 10 * this.dpr;
    }

    // Main red rectangle
    this.ctx.fillStyle = '#ff3b30'; // Bright red
    this.drawRoundedRect(
      centerX - drawSize / 2,
      centerY - drawSize / 2,
      drawSize,
      drawSize,
      radius
    );
    this.ctx.fill();

    // Reset shadow blur to draw inner detailing
    this.ctx.shadowBlur = 0;

    // Detail for color-blind accessibility (white cross in the center of the food)
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.5 * this.dpr;
    this.ctx.beginPath();
    
    const crossSize = 2 * this.dpr;
    // Horizontal line
    this.ctx.moveTo(centerX - crossSize, centerY);
    this.ctx.lineTo(centerX + crossSize, centerY);
    // Vertical line
    this.ctx.moveTo(centerX, centerY - crossSize);
    this.ctx.lineTo(centerX, centerY + crossSize);
    
    this.ctx.stroke();

    this.ctx.restore();
  }

  public render(snake: Snake, food: Food, state: GameState): void {
    this.pulseTime++;
    this.clear();
    this.drawGrid();

    if (state !== 'HOME') {
      this.drawSnake(snake);
      this.drawFood(food);
      
      this.updateParticles();
      this.drawParticles();
    }
  }

  public resetParticles(): void {
    this.particles = [];
  }
}
