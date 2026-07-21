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
   * Calculate next head position without mutating snake body.
   */
  public getNextHead(dir: Direction): Position {
    const currentHead = this.getHead();
    const vector = DIRECTIONS[dir];
    if (!vector) {
      throw new Error(`Invalid direction: ${dir}`);
    }
    return {
      x: currentHead.x + vector.x,
      y: currentHead.y + vector.y
    };
  }

  /**
   * Checks if next head position collides with the snake body.
   * If ateFood is false, the tail will move out of the way, so it is ignored.
   */
  public willCollideWithSelf(nextHead: Position, ateFood: boolean): boolean {
    const segmentsToCheck = ateFood ? this.body : this.body.slice(0, -1);
    return segmentsToCheck.some(seg => seg.x === nextHead.x && seg.y === nextHead.y);
  }

  /**
   * Commit a move with nextHead, nextDir and whether it ate food.
   */
  public commitMove(nextHead: Position, nextDir: Direction, ateFood: boolean): Position | null {
    // Store current state as previous body for rendering interpolation
    this.previousBody = this.body.map(pos => ({ ...pos }));

    this.direction = nextDir;

    // Add new head to body
    this.body.unshift(nextHead);

    if (ateFood) {
      return null; // Grew, so tail was not removed
    } else {
      // Remove tail
      const tail = this.body.pop();
      return tail ? tail : null;
    }
  }

  /**
   * Move the snake forward one cell (legacy method).
   * Returns the removed tail position if it didn't grow, or null if it did.
   */
  public move(nextDir: Direction): Position | null {
    const nextHead = this.getNextHead(nextDir);
    const ateFood = this.growPending > 0;
    if (ateFood) {
      this.growPending--;
    }
    return this.commitMove(nextHead, nextDir, ateFood);
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
