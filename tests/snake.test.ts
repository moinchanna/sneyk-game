import { describe, it, expect, beforeEach } from 'vitest';
import { Snake } from '../src/game/Snake';
import { GRID_CELLS } from '../src/game/constants';

describe('Snake Logic Tests', () => {
  let snake: Snake;
  const initialLength = 4;

  beforeEach(() => {
    // Initialize snake with default length
    snake = new Snake(GRID_CELLS, initialLength);
  });

  it('should initialize with correct length and default direction RIGHT', () => {
    const body = snake.getBody();
    expect(body.length).toBe(initialLength);
    expect(snake.getDirection()).toBe('RIGHT');
  });

  it('should move in the expected direction', () => {
    const headBefore = snake.getHead();
    
    // Move RIGHT
    const oldTail = snake.move('RIGHT');
    const headAfter = snake.getHead();

    expect(headAfter.x).toBe(headBefore.x + 1);
    expect(headAfter.y).toBe(headBefore.y);
    expect(oldTail).not.toBeNull();
    expect(snake.getBody().length).toBe(initialLength);
  });

  it('should grow after eating (grow pending)', () => {
    const lengthBefore = snake.getBody().length;
    
    // Trigger growth
    snake.grow();
    
    // Move after growth trigger
    const oldTail = snake.move('RIGHT');

    expect(oldTail).toBeNull(); // Tail was not removed, meaning it grew
    expect(snake.getBody().length).toBe(lengthBefore + 1);
  });

  it('should detect wall collision', () => {
    // Place snake right at the left border
    snake.reset(GRID_CELLS, initialLength, 'LEFT');
    
    // Position head at x: 0
    const body = snake.getBody();
    body[0]!.x = 0;
    
    // Force set the body (we have to mock reset or modify directly since getBody returns copy)
    // Let's reset the snake and move left until it hits the wall
    // Starting X is gridCells/3 = 6
    // Move LEFT 7 times
    expect(snake.checkWallCollision(GRID_CELLS)).toBe(false);
    
    for (let i = 0; i < 7; i++) {
      snake.move('LEFT');
    }
    
    expect(snake.checkWallCollision(GRID_CELLS)).toBe(true);
  });

  it('should detect self-collision', () => {
    // Grow snake to length 6 so it can bite itself
    snake.grow(); // length 5
    snake.move('RIGHT');
    snake.grow(); // length 6
    snake.move('RIGHT');
    
    expect(snake.getBody().length).toBe(6);
    expect(snake.checkSelfCollision()).toBe(false);

    // Force a tight loop to bite itself:
    // Moving UP, then LEFT, then DOWN
    snake.move('UP');
    snake.move('LEFT');
    snake.move('DOWN');

    expect(snake.checkSelfCollision()).toBe(true);
  });
});
