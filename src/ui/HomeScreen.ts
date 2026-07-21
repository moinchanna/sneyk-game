import { GRID_CELLS } from '../game/constants';
import { Position } from '../game/types';

export class HomeScreen {
  private container: HTMLElement;
  private canvasWrap: HTMLElement;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;

  // Decorative Snake properties
  private snakeBody: Position[] = [];
  private direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' = 'RIGHT';
  private food: Position = { x: 12, y: 14 };
  private lastUpdate = 0;
  private updateInterval = 600; // Slower, subtle movement (600ms per cell)
  private cellSize = 20;

  constructor() {
    const home = document.getElementById('home-screen');
    const wrap = document.getElementById('decorative-snake-canvas-wrap');
    if (!home || !wrap) {
      throw new Error('Home screen elements not found in DOM');
    }
    this.container = home;
    this.canvasWrap = wrap;
    this.initDecorativeCanvas();
  }

  private initDecorativeCanvas(): void {
    // Create background canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.zIndex = '1';
    this.canvas.style.opacity = '0.15'; // Very subtle overlay
    this.canvas.style.pointerEvents = 'none';

    this.canvasWrap.appendChild(this.canvas);
    const context = this.canvas.getContext('2d');
    if (context) {
      this.ctx = context;
    }

    this.resizeCanvas();
    this.initDecorativeSnake();
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    this.resizeCanvas();
    this.draw();
  };

  private resizeCanvas(): void {
    if (!this.canvas) return;
    const parent = this.canvasWrap;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;

    this.cellSize = (width * dpr) / GRID_CELLS;
  }

  private initDecorativeSnake(): void {
    // Pre-create a winding path in the bottom half of the 40x40 grid
    this.snakeBody = [];
    const startY = 25;
    for (let i = 0; i < 24; i++) {
      this.snakeBody.push({ x: 28 - i, y: startY });
    }
    this.direction = 'UP';
    this.food = { x: 30, y: 22 };
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.resizeCanvas();
    this.lastUpdate = performance.now();
    this.startAnimation();
  }

  public hide(): void {
    this.container.classList.add('hidden');
    this.stopAnimation();
  }

  private startAnimation(): void {
    this.stopAnimation();
    this.animationId = requestAnimationFrame(this.animate);
  }

  private stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = (timestamp: number): void => {
    if (!this.canvas || !this.ctx) return;

    const delta = timestamp - this.lastUpdate;
    if (delta >= this.updateInterval) {
      this.updateDecorativeSnake();
      this.lastUpdate = timestamp;
    }

    this.draw();
    this.animationId = requestAnimationFrame(this.animate);
  };

  /**
   * Slowly slithers the background snake in a loop or winding motion
   */
  private updateDecorativeSnake(): void {
    const head = this.snakeBody[0];
    if (!head) return;

    let nextX = head.x;
    let nextY = head.y;

    // Determine direction change based on borders to wander in a rectangular loop (bottom-middle region)
    if (this.direction === 'UP' && head.y <= 18) {
      this.direction = 'RIGHT';
    } else if (this.direction === 'RIGHT' && head.x >= 35) {
      this.direction = 'DOWN';
    } else if (this.direction === 'DOWN' && head.y >= 35) {
      this.direction = 'LEFT';
    } else if (this.direction === 'LEFT' && head.x <= 5) {
      this.direction = 'UP';
    }

    switch (this.direction) {
      case 'UP':
        nextY--;
        break;
      case 'DOWN':
        nextY++;
        break;
      case 'LEFT':
        nextX--;
        break;
      case 'RIGHT':
        nextX++;
        break;
    }

    // Move snake
    this.snakeBody.unshift({ x: nextX, y: nextY });
    this.snakeBody.pop();

    // If snake eats food, move food to a new decorative spot
    if (nextX === this.food.x && nextY === this.food.y) {
      this.food = {
        x: 6 + Math.floor(Math.random() * 28),
        y: 19 + Math.floor(Math.random() * 15)
      };
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    if (!this.canvas || !ctx) return;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const dpr = window.devicePixelRatio || 1;
    const gap = 1 * dpr;
    const radius = 2 * dpr;

    // Draw food (red square)
    ctx.fillStyle = '#ff3b30';
    const foodX = this.food.x * this.cellSize + gap;
    const foodY = this.food.y * this.cellSize + gap;
    const foodSize = this.cellSize - gap * 2;
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(foodX, foodY, foodSize, foodSize, radius)
      : ctx.rect(foodX, foodY, foodSize, foodSize);
    ctx.fill();

    // Draw snake body (light-gray squares with spaces)
    ctx.fillStyle = '#e5e5ea';
    this.snakeBody.forEach(segment => {
      const x = segment.x * this.cellSize + gap;
      const y = segment.y * this.cellSize + gap;
      const size = this.cellSize - gap * 2;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, size, size, radius) : ctx.rect(x, y, size, size);
      ctx.fill();
    });
  }

  public destroy(): void {
    this.stopAnimation();
    window.removeEventListener('resize', this.handleResize);
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }
}
