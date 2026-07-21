import { Position, Direction } from './types';
import { DIRECTIONS } from './constants';

export class Snake {
  private body: Position[] = [];
  private previousBody: Position[] = [];
  private direction: Direction = 'RIGHT';
  private growPending = 0;

  constructor(cols: number, rows: number, initialLength: number) {
    this.reset(cols, rows, initialLength);
  }

  public reset(cols: number, rows: number, initialLength: number, dir: Direction = 'RIGHT'): void {
    this.direction = dir;
    this.growPending = 0;
    this.body = [];

    // Center snake horizontally and vertically
    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);

    for (let i = 0; i < initialLength; i++) {
      this.body.push({
        x: startX - i,
        y: startY
      });
    }

    // Initialize previousBody to match current body on reset
    this.previousBody = this.body.map(pos => ({ ...pos }));
  }

  public getBody(): Position[] {
    return this.body.map(pos => ({ ...pos }));
  }

  public getHead(): Position {
    const head = this.body[0];
    if (!head) {
      throw new Error('Snake has no head!');
    }
    return { ...head };
  }

  public getDirection(): Direction {
    return this.direction;
  }

  public grow(): void {
    this.growPending++;
  }

  /**
   * Move the snake forward one cell.
   * Returns the removed tail position if it didn't grow, or null if it did.
   */
  public move(nextDir: Direction): Position | null {
    // Store current state as previous body for rendering interpolation
    this.previousBody = this.body.map(pos => ({ ...pos }));

    this.direction = nextDir;
    const currentHead = this.getHead();
    const vector = DIRECTIONS[nextDir];

    if (!vector) {
      throw new Error(`Invalid direction: ${nextDir}`);
    }

    const newHead: Position = {
      x: currentHead.x + vector.x,
      y: currentHead.y + vector.y
    };

    // Add new head to body
    this.body.unshift(newHead);

    if (this.growPending > 0) {
      this.growPending--;
      return null; // Grew, so tail was not removed
    } else {
      // Remove tail
      const tail = this.body.pop();
      return tail ? tail : null;
    }
  }

  /**
   * Calculates smooth interpolated positions for rendering
   */
  public getInterpolatedBody(alpha: number): Position[] {
    if (this.previousBody.length === 0) {
      return this.getBody();
    }

    return this.body.map((segment, index) => {
      // For a new tail segment created during growth, interpolate from the old tail
      const prevSegment =
        this.previousBody[index] || this.previousBody[this.previousBody.length - 1];
      if (!prevSegment) {
        return { ...segment };
      }

      // Check if coordinates difference is > 1 (e.g. wall wrapping or reset snaps)
      // If so, disable interpolation for this segment and snap immediately to prevent diagonal cutting
      const dx = Math.abs(segment.x - prevSegment.x);
      const dy = Math.abs(segment.y - prevSegment.y);
      if (dx > 1 || dy > 1) {
        return { ...segment };
      }

      return {
        x: prevSegment.x + (segment.x - prevSegment.x) * alpha,
        y: prevSegment.y + (segment.y - prevSegment.y) * alpha
      };
    });
  }

  public checkSelfCollision(): boolean {
    if (this.body.length <= 4) return false;

    const head = this.getHead();
    // Check if head matches any of the body segments (skipping head itself at index 0)
    for (let i = 1; i < this.body.length; i++) {
      const segment = this.body[i];
      if (segment && segment.x === head.x && segment.y === head.y) {
        return true;
      }
    }
    return false;
  }

  public checkWallCollision(cols: number, rows: number): boolean {
    const head = this.getHead();
    return head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows;
  }
}
