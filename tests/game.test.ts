/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game/Game';
import { Storage } from '../src/game/Storage';

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
        quadraticCurveTo: () => {}
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

  it('should support eating food, increasing score and length, and updating best score', () => {
    game.prepareGame();

    // Explicitly place snake head at (10, 10) moving RIGHT, length 4
    (game.snake as any).body = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ];
    (game.snake as any).direction = 'RIGHT';

    // Place food exactly one cell ahead at (11, 10)
    (game.food as any).position = { x: 11, y: 10 };

    // Set state to PLAYING to allow tick to execute
    (game as any).state = 'PLAYING';

    // Track score changes via callback
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

    // Execute another tick to consume the pending growth
    (game as any).tick();

    // Snake length should increase by exactly 1 (from 4 to 5)
    expect(game.snake.getBody().length).toBe(5);

    // Score should increase from 0 to 10
    expect((game as any).score).toBe(10);
    expect(reportedScore).toBe(10);

    // Stored best score should update to 10
    expect((game as any).bestScore).toBe(10);
    expect(reportedBest).toBe(10);
    expect(Storage.getBestScore()).toBe(10);

    // Food should respawn outside of the snake's body
    const foodPos = game.food.getPosition();
    const isOccupied = game.snake.getBody().some(seg => seg.x === foodPos.x && seg.y === foodPos.y);
    expect(isOccupied).toBe(false);
  });

  it('should reset score to 0 on restart but preserve best score', () => {
    // Mock existing best score in storage
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
  });

  it('should not perform movement ticks in READY state and start only on input', () => {
    game.prepareGame(); // Sets state to READY
    expect((game as any).state).toBe('READY');

    const initialHead = game.snake.getHead();

    // Call tick in READY state - should not move
    (game as any).tick();
    expect(game.snake.getHead()).toEqual(initialHead);

    // Simulate direction input to start game
    game.startSimulation();
    expect((game as any).state).toBe('PLAYING');

    // Run tick in PLAYING state - should move
    (game as any).tick();

    // Head should have moved
    const newHead = game.snake.getHead();
    expect(newHead.x !== initialHead.x || newHead.y !== initialHead.y).toBe(true);
  });
});
