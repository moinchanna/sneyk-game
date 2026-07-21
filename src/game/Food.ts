import { Position } from './types';

export class Food {
  private position: Position = { x: 0, y: 0 };

  constructor(snakeBody: Position[], cols: number, rows: number, randomFn?: () => number) {
    this.spawn(snakeBody, cols, rows, randomFn);
  }

  public getPosition(): Position {
    return { ...this.position };
  }

  /**
   * Spawn food on a random cell that does not overlap with the snake.
   * Uses a safe list of empty cells to avoid infinite loops when the grid is almost full.
   */
  public spawn(
    snakeBody: Position[],
    cols: number,
    rows: number,
    randomFn: () => number = Math.random
  ): boolean {
    const emptyCells: Position[] = [];

    // Create set of occupied coordinates for faster O(1) lookup
    const occupied = new Set<string>();
    for (const segment of snakeBody) {
      occupied.add(`${segment.x},${segment.y}`);
    }

    // Collect all unoccupied grid cells within cols & rows bounds
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (!occupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) {
      // Board is completely full
      return false;
    }

    // Choose random empty cell
    const randomIndex = Math.floor(randomFn() * emptyCells.length);
    const chosenCell = emptyCells[randomIndex];

    if (chosenCell) {
      this.position = chosenCell;
      return true;
    }

    return false;
  }
}
