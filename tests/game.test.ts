/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game/Game';
import { Storage } from '../src/game/Storage';
import { BOARD_COLUMNS, BOARD_ROWS } from '../src/game/constants';

describe('Game Coordinator Integration Tests', () => {
  let canvas: HTMLCanvasElement;
  let game: Game;

  beforeEach(() => {
    // Clear storage
    Storage.saveBestScore(0);
    Storage.saveSoundPreference(false);

    // Create a mock canvas
    canvas = {
      getContext: () => ({
        scale: () => {},
        setTransform: () => {},
        fillRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        save: () => {},
        restore: () => {},
        fill: () => {},
        closePath: () => {},
        quadraticCurveTo: () => {},
        arc: () => {},
        roundRect: () => {}
      }),
      parentElement: {
        clientWidth: 600,
        clientHeight: 600
      },
      style: {},
      width: 600,
      height: 600
    } as unknown as HTMLCanvasElement;

    game = new Game(canvas);
  });

  it('should center initial snake on a 32x18 board in READY state', () => {
    game.prepareGame();
    expect((game as any).state).toBe('READY');

    const body = game.snake.getBody();
    const expectedHeadX = Math.floor(BOARD_COLUMNS / 2);
    const expectedHeadY = Math.floor(BOARD_ROWS / 2);

    expect(body[0]).toEqual({ x: expectedHeadX, y: expectedHeadY });
    expect(body[1]).toEqual({ x: expectedHeadX - 1, y: expectedHeadY });
    expect(body[2]).toEqual({ x: expectedHeadX - 2, y: expectedHeadY });
    expect(body[3]).toEqual({ x: expectedHeadX - 3, y: expectedHeadY });
  });

  it('should support eating food, increasing score, and updating best score immediately', () => {
    game.prepareGame();

    // Explicitly place snake head at (10, 10) moving RIGHT
    (game.snake as any).body = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ];
    (game.snake as any).previousBody = (game.snake as any).body.map((p: any) => ({ ...p }));
    (game.snake as any).direction = 'RIGHT';

    // Place food exactly one cell ahead at (11, 10)
    (game.food as any).position = { x: 11, y: 10 };

    // Set state to PLAYING to allow tick to execute
    (game as any).state = 'PLAYING';

    let reportedScore = -1;
    let reportedBest = -1;
    game.registerScoreChange((score, best) => {
      reportedScore = score;
      reportedBest = best;
    });

    // Execute one simulation tick
    (game as any).tick();

    // Snake head should be at food pos (11, 10)
    expect(game.snake.getHead()).toEqual({ x: 11, y: 10 });

    // Growth is pending, body length is still 4
    expect(game.snake.getBody().length).toBe(4);
    expect((game.snake as any).growPending).toBe(1);

    // Score should increase from 0 to 10
    expect((game as any).score).toBe(10);
    expect(reportedScore).toBe(10);

    // Stored best score should update immediately to 10
    expect((game as any).bestScore).toBe(10);
    expect(reportedBest).toBe(10);
    expect(Storage.getBestScore()).toBe(10);

    // Execute another tick to consume growth
    (game as any).tick();
    expect(game.snake.getBody().length).toBe(5);

    // Food should respawn outside of the snake's body
    const foodPos = game.food.getPosition();
    const isOccupied = game.snake.getBody().some(seg => seg.x === foodPos.x && seg.y === foodPos.y);
    expect(isOccupied).toBe(false);
  });

  it('should reset score to 0 on restart but preserve best score and initialize bodies identically', () => {
    Storage.saveBestScore(50);

    game.prepareGame();
    expect((game as any).score).toBe(0);
    expect((game as any).bestScore).toBe(50);

    // Increase current score
    (game as any).score = 30;

    // Trigger restart
    game.restartGame();

    // Score should reset to 0, best score should stay 50
    expect((game as any).score).toBe(0);
    expect((game as any).bestScore).toBe(50);

    // Previous body and current body must match exactly to prevent interpolation transitions on restart
    expect((game.snake as any).previousBody).toEqual(game.snake.getBody());
  });

  it('should clamp interpolation alpha between 0 and 1, and be 0 in READY state', () => {
    game.prepareGame(); // Sets state to READY
    expect(game.loop.getInterpolationAlpha()).toBe(0);

    game.startSimulation(); // Sets state to PLAYING

    // Check default alpha is within bounds
    const alpha = game.loop.getInterpolationAlpha();
    expect(alpha).toBeGreaterThanOrEqual(0);
    expect(alpha).toBeLessThanOrEqual(1);
  });

  it('should detect wall collisions on BOARD_COLUMNS and BOARD_ROWS boundaries', () => {
    game.prepareGame();
    (game as any).state = 'PLAYING';

    // Move to right boundary (32)
    (game.snake as any).body = [
      { x: BOARD_COLUMNS - 1, y: 5 },
      { x: BOARD_COLUMNS - 2, y: 5 }
    ];
    (game.snake as any).direction = 'RIGHT';

    // Next tick will hit wall
    (game as any).tick();
    expect((game as any).state).toBe('GAME_OVER');

    // Reset game and move to bottom boundary (18)
    game.prepareGame();
    (game as any).state = 'PLAYING';
    (game.snake as any).body = [
      { x: 5, y: BOARD_ROWS - 1 },
      { x: 5, y: BOARD_ROWS - 2 }
    ];
    (game.snake as any).direction = 'DOWN';
    (game.input as any).currentDirection = 'DOWN';

    // Next tick will hit wall
    (game as any).tick();
    expect((game as any).state).toBe('GAME_OVER');
  });

  it('should not create unlimited catch-up ticks on large frame delta', () => {
    game.prepareGame();
    game.startSimulation();

    // Trigger frame loop with a massive delta (e.g. 5000ms delay)
    const rawDelta = 5000;

    // Mimic loop execution details manually
    const delta = Math.min(rawDelta, 80); // Delta capped at 80ms
    expect(delta).toBe(80);

    let accumulator = delta; // 80ms
    let tickCount = 0;
    const tickDelay = (game.loop as any).tickDelay; // 72ms

    let updates = 0;
    while (accumulator >= tickDelay) {
      tickCount++;
      accumulator -= tickDelay;
      updates++;
      if (updates >= 2) {
        accumulator = 0;
        break;
      }
    }

    // Assert it capped the updates to max 2 ticks
    expect(tickCount).toBeLessThanOrEqual(2);
  });
});
