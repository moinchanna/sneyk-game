import { Position, GameState, Particle, GameSettings } from './types';
import { Snake } from './Snake';
import { Food } from './Food';
import { BOARD_COLUMNS, BOARD_ROWS } from './constants';
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

    // Use parent's client dimensions; fallback to canvas attributes or defaults if zero.
    let width = parent.clientWidth;
    let height = parent.clientHeight;
    if (width === 0 || height === 0) {
      width = this.canvas.width || 400;
      height = this.canvas.height || 400;
    }

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Reset transform for crisp rendering.
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const cellWidth = width / BOARD_COLUMNS;
    const cellHeight = height / BOARD_ROWS;

    this.cellSize = Math.min(cellWidth, cellHeight);

    if (Math.abs(cellWidth - cellHeight) > 0.5) {
      console.warn(`Board aspect ratio does not match logical grid: cellWidth=${cellWidth}, cellHeight=${cellHeight}`);
    }
  }

  public clear(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.fillStyle = '#050506'; // --board-bg
    this.ctx.fillRect(0, 0, w, h);
  }

  /**
   * Spawns particle explosion at the eaten food location
   */
  public spawnParticles(gridPos: Position, color: string): void {
    if (this.settings.reducedMotion) return;

    const count = 12;
    const centerX = gridPos.x * this.cellSize + this.cellSize / 2;
    const centerY = gridPos.y * this.cellSize + this.cellSize / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 2.5;

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: 1.5 + Math.random() * 2, // size in CSS pixels
        life: 0,
        maxLife: 20 + Math.floor(Math.random() * 10) // ticks
      });
    }
  }

  public updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p) continue;

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94; // Friction
      p.vy *= 0.94;
      p.life++;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

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

  private drawRoundedRect(x: number, y: number, w: number, h: number, r: number): void {
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
    this.ctx.lineWidth = 0.5;

    const boardWidth = BOARD_COLUMNS * this.cellSize;
    const boardHeight = BOARD_ROWS * this.cellSize;

    for (let i = 0; i <= BOARD_COLUMNS; i++) {
      const pos = i * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, boardHeight);
      this.ctx.stroke();
    }

    for (let j = 0; j <= BOARD_ROWS; j++) {
      const pos = j * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(boardWidth, pos);
      this.ctx.stroke();
    }
  }

  private drawSnake(snake: Snake, alpha: number): void {
    const body = snake.getInterpolatedBody(alpha);
    const direction = snake.getDirection();
    const radius = 1; // Small pixel corner radius

    // Segment occupies 72% of each logical cell
    const segmentRatio = 0.72;
    const segmentSize = Math.floor(this.cellSize * segmentRatio);
    const segmentOffset = Math.max(0, (this.cellSize - segmentSize) / 2);

    body.forEach((segment, index) => {
      const isHead = index === 0;

      const x = segment.x * this.cellSize + segmentOffset;
      const y = segment.y * this.cellSize + segmentOffset;

      let fillStyle = '#b9b9bd'; // --snake-color
      if (isHead) {
        fillStyle = '#eeeeef'; // --snake-head-color
      } else {
        const decay = Math.min(index / 24, 0.4);
        const brightness = Math.floor(185 - decay * 80);
        fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + 4})`;
      }

      this.ctx.fillStyle = fillStyle;
      this.drawRoundedRect(x, y, segmentSize, segmentSize, radius);
      this.ctx.fill();

      // Draw eyes on the head
      if (isHead) {
        this.ctx.fillStyle = '#050507';
        const eyeSize = 2;
        const eyeOffset = Math.max(2, Math.floor(segmentSize * 0.22));

        let eye1X = 0,
          eye1Y = 0,
          eye2X = 0,
          eye2Y = 0;

        switch (direction) {
          case 'UP':
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + segmentSize - eyeOffset - eyeSize;
            eye2Y = y + eyeOffset;
            break;
          case 'DOWN':
            eye1X = x + eyeOffset;
            eye1Y = y + segmentSize - eyeOffset - eyeSize;
            eye2X = x + segmentSize - eyeOffset - eyeSize;
            eye2Y = y + segmentSize - eyeOffset - eyeSize;
            break;
          case 'LEFT':
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + eyeOffset;
            eye2Y = y + segmentSize - eyeOffset - eyeSize;
            break;
          case 'RIGHT':
            eye1X = x + segmentSize - eyeOffset - eyeSize;
            eye1Y = y + eyeOffset;
            eye2X = x + segmentSize - eyeOffset - eyeSize;
            eye2Y = y + segmentSize - eyeOffset - eyeSize;
            break;
        }

        this.ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
        this.ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
      }
    });
  }

  private drawFood(food: Food): void {
    const pos = food.getPosition();
    // Food occupies 74% of each logical cell
    const foodRatio = 0.74;
    const segmentSize = Math.floor(this.cellSize * foodRatio);
    const segmentOffset = Math.max(0, (this.cellSize - segmentSize) / 2);
    const x = pos.x * this.cellSize + segmentOffset;
    const y = pos.y * this.cellSize + segmentOffset;
    const radius = 1;

    this.ctx.save();

    let pulse = 1.0;
    if (!this.settings.reducedMotion) {
      pulse = 0.96 + Math.sin(this.pulseTime * 0.15) * 0.04;
    }

    const centerX = x + segmentSize / 2;
    const centerY = y + segmentSize / 2;
    const drawSize = segmentSize * pulse;

    // Subtle red glow
    if (!this.settings.reducedMotion) {
      this.ctx.shadowColor = 'rgba(215, 32, 32, 0.5)';
      this.ctx.shadowBlur = 6;
    }

    // Main red rectangle
    this.ctx.fillStyle = '#d72020'; // --food-color
    this.drawRoundedRect(
      centerX - drawSize / 2,
      centerY - drawSize / 2,
      drawSize,
      drawSize,
      radius
    );
    this.ctx.fill();

    // Reset shadow
    this.ctx.shadowBlur = 0;

    // Cross detail for accessibility
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    const crossSize = 1.5;
    this.ctx.moveTo(centerX - crossSize, centerY);
    this.ctx.lineTo(centerX + crossSize, centerY);
    this.ctx.moveTo(centerX, centerY - crossSize);
    this.ctx.lineTo(centerX, centerY + crossSize);
    this.ctx.stroke();

    this.ctx.restore();
  }

  public render(snake: Snake, food: Food, state: GameState, alpha = 0): void {
    this.pulseTime++;
    this.clear();
    this.drawGrid();

    if (state !== 'HOME') {
      this.drawSnake(snake, alpha);
      this.drawFood(food);

      this.updateParticles();
      this.drawParticles();
    }
  }

  public resetParticles(): void {
    this.particles = [];
  }
}
