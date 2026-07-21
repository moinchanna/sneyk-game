import { Position, Direction } from './types';
import { DIRECTIONS } from './constants';

export class Snake {
  private body: Position[] = [];
  private direction: Direction = 'RIGHT';
  private growPending = 0;

  constructor(gridCells: number, initialLength: number) {
    this.reset(gridCells, initialLength);
  }

  public reset(gridCells: number, initialLength: number, dir: Direction = 'RIGHT'): void {
    this.direction = dir;
    this.growPending = 0;
    this.body = [];

    // Center snake vertically, start a few cells from the left
    const startY = Math.floor(gridCells / 2);
    const startX = Math.floor(gridCells / 3);

    for (let i = 0; i < initialLength; i++) {
      this.body.push({
        x: startX - i,
        y: startY
      });
    }
  }

  public getBody(): Position[] {
    // Return a copy to avoid mutation outside
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

  public checkSelfCollision(): boolean {
    if (this.body.length <= 4) return false; // Snake cannot crash into itself if length is <= 4

    const head = this.getHead();
    // Check if head matches any of the body segments (skipping index 0 which is the head itself)
    for (let i = 1; i < this.body.length; i++) {
      const segment = this.body[i];
      if (segment && segment.x === head.x && segment.y === head.y) {
        return true;
      }
    }
    return false;
  }

  public checkWallCollision(gridCells: number): boolean {
    const head = this.getHead();
    return head.x < 0 || head.y < 0 || head.x >= gridCells || head.y >= gridCells;
  }
}
