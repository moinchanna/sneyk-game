import { describe, it, expect } from 'vitest';
import { Food } from '../src/game/Food';
import { Position } from '../src/game/types';
import { GRID_CELLS } from '../src/game/constants';

describe('Food Logic Tests', () => {
  it('should spawn food on an empty cell and never overlap with the snake', () => {
    // Mock snake body occupying almost all cells except one
    const snakeBody: Position[] = [];
    for (let x = 0; x < GRID_CELLS; x++) {
      for (let y = 0; y < GRID_CELLS; y++) {
        // Leave exactly one cell empty at (5, 5)
        if (x === 5 && y === 5) continue;
        snakeBody.push({ x, y });
      }
    }

    // Spawn food
    const food = new Food(snakeBody, GRID_CELLS);
    
    // The only empty cell is (5, 5), so food MUST spawn there
    expect(food.getPosition()).toEqual({ x: 5, y: 5 });
  });

  it('should return false if the board is completely full', () => {
    // Fill the entire grid with snake segments
    const snakeBody: Position[] = [];
    for (let x = 0; x < GRID_CELLS; x++) {
      for (let y = 0; y < GRID_CELLS; y++) {
        snakeBody.push({ x, y });
      }
    }

    const food = new Food(snakeBody, GRID_CELLS);
    const spawned = food.spawn(snakeBody, GRID_CELLS);

    expect(spawned).toBe(false);
  });
});
