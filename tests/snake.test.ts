import { describe, it, expect, beforeEach } from 'vitest';
import { Snake } from '../src/game/Snake';
import { BOARD_COLUMNS, BOARD_ROWS } from '../src/game/constants';

describe('Snake Logic Tests', () => {
  let snake: Snake;
  const initialLength = 4;

  beforeEach(() => {
    // Initialize snake with default length on 32x18 board
    snake = new Snake(BOARD_COLUMNS, BOARD_ROWS, initialLength);
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
    // Reset snake moving LEFT
    snake.reset(BOARD_COLUMNS, BOARD_ROWS, initialLength, 'LEFT');

    expect(snake.checkWallCollision(BOARD_COLUMNS, BOARD_ROWS)).toBe(false);

    // Move LEFT until we hit the wall (startX = BOARD_COLUMNS / 2 = 16)
    const startX = Math.floor(BOARD_COLUMNS / 2);
    for (let i = 0; i <= startX; i++) {
      snake.move('LEFT');
    }

    expect(snake.checkWallCollision(BOARD_COLUMNS, BOARD_ROWS)).toBe(true);
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

  it('should compute correct interpolated positions', () => {
    // Before first move, previousBody matches body
    const initialBody = snake.getBody();
    const interpolatedInit = snake.getInterpolatedBody(0.5);
    expect(interpolatedInit).toEqual(initialBody);

    // Move RIGHT
    const nextBody = snake.getBody();
    snake.move('RIGHT');

    // Interpolation at alpha = 0.5
    const interpolated = snake.getInterpolatedBody(0.5);
    expect(interpolated[0]!.x).toBe(nextBody[0]!.x + 0.5);
    expect(interpolated[0]!.y).toBe(nextBody[0]!.y);
  });
});
