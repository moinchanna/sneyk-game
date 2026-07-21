import { Position } from './types';

export class Food {
  private position: Position = { x: 0, y: 0 };

  constructor(snakeBody: Position[], gridCells: number, randomFn?: () => number) {
    this.spawn(snakeBody, gridCells, randomFn);
  }

  public getPosition(): Position {
    return { ...this.position };
  }

  /**
   * Spawn food on a random cell that does not overlap with the snake.
   * Uses a safe list of empty cells to avoid infinite loop matching when grid is almost full.
   */
  public spawn(snakeBody: Position[], gridCells: number, randomFn: () => number = Math.random): boolean {
    const emptyCells: Position[] = [];

    // Create set of occupied coords for faster O(1) lookup
    const occupied = new Set<string>();
    for (const segment of snakeBody) {
      occupied.add(`${segment.x},${segment.y}`);
    }

    // Collect all unoccupied grid cells
    for (let x = 0; x < gridCells; x++) {
      for (let y = 0; y < gridCells; y++) {
        if (!occupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) {
      // Board is completely full (win or draw condition handled by game)
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
