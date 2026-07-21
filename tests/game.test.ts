/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
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

    // Setup required DOM elements
    document.body.innerHTML = `
      <div id="canvas-container"></div>
      <div id="game-over-msg"></div>
      <div id="announcer"></div>
    `;

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
      getBoundingClientRect: () => ({
        width: 640,
        height: 360
      }),
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
    (game.input as any).currentDirection = 'RIGHT';

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
    
    // Check that length grew to 5 because tail was not removed
    expect(game.snake.getBody().length).toBe(5);

    // Score should increase from 0 to 10
    expect((game as any).score).toBe(10);
    expect(reportedScore).toBe(10);

    // Stored best score should update immediately to 10
    expect((game as any).bestScore).toBe(10);
    expect(reportedBest).toBe(10);
    expect(Storage.getBestScore()).toBe(10);
  });

  it('should report score 20 after eating two deterministic food items', () => {
    game.prepareGame();
    
    // Explicitly place snake head at (10, 10) moving RIGHT
    (game.snake as any).body = [
      { x: 10, y: 10 },
      { x: 9, y: 10 }
    ];
    (game.snake as any).previousBody = (game.snake as any).body.map((p: any) => ({ ...p }));
    (game.snake as any).direction = 'RIGHT';
    (game.input as any).currentDirection = 'RIGHT';

    // Place first food at (11, 10)
    (game.food as any).position = { x: 11, y: 10 };

    (game as any).state = 'PLAYING';

    // First eat
    (game as any).tick();
    expect((game as any).score).toBe(10);

    // Place second food at (12, 10)
    (game.food as any).position = { x: 12, y: 10 };

    // Second eat
    (game as any).tick();
    expect((game as any).score).toBe(20);
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

  it('should prove a snake at (5, 17) is valid and only crashes after next downward move to (5, 18)', () => {
    game.prepareGame();
    (game as any).state = 'PLAYING';

    // Position head at (5, 17) moving DOWN
    (game.snake as any).body = [
      { x: 5, y: BOARD_ROWS - 1 },
      { x: 5, y: BOARD_ROWS - 2 }
    ];
    (game.snake as any).direction = 'DOWN';
    (game.input as any).currentDirection = 'DOWN';

    // Before tick, check head is (5, 17) and game is PLAYING
    expect(game.snake.getHead()).toEqual({ x: 5, y: 17 });
    expect((game as any).state).toBe('PLAYING');

    // Next tick moves it to (5, 18) which triggers wall collision
    (game as any).tick();
    expect(game.snake.getHead()).toEqual({ x: 5, y: 17 }); // Snake was not mutated because validation failed
    expect((game as any).state).toBe('GAME_OVER');
    
    // Ensure the message element displays wall collision reason
    const gameOverMsg = document.getElementById('game-over-msg');
    expect(gameOverMsg?.textContent).toBe('You crashed into the wall!');
  });

  it('should detect wall collisions on right boundary (32) and report it explicitly', () => {
    game.prepareGame();
    (game as any).state = 'PLAYING';

    // Position head at (31, 5) moving RIGHT
    (game.snake as any).body = [
      { x: BOARD_COLUMNS - 1, y: 5 },
      { x: BOARD_COLUMNS - 2, y: 5 }
    ];
    (game.snake as any).direction = 'RIGHT';
    (game.input as any).currentDirection = 'RIGHT';

    // Next tick moves it to (32, 5) triggering wall crash
    (game as any).tick();
    expect((game as any).state).toBe('GAME_OVER');
    const gameOverMsg = document.getElementById('game-over-msg');
    expect(gameOverMsg?.textContent).toBe('You crashed into the wall!');
  });

  it('should detect self-collision and report it explicitly', () => {
    game.prepareGame();
    (game as any).state = 'PLAYING';

    // Form a snake that will collide with itself on next tick (length 5)
    (game.snake as any).body = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 11, y: 11 },
      { x: 11, y: 10 },
      { x: 10, y: 10 }
    ];
    (game.snake as any).direction = 'LEFT';
    (game.input as any).currentDirection = 'LEFT';

    // Next tick moves head to (9, 10) which is safe.
    // Let's force it to bite itself by moving UP from (10,10) to (10,10) which is occupied
    (game.snake as any).body = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 9, y: 11 },
      { x: 10, y: 11 },
      { x: 10, y: 10 }
    ];
    (game.snake as any).direction = 'DOWN';
    (game.input as any).currentDirection = 'DOWN';

    (game as any).tick();
    expect((game as any).state).toBe('GAME_OVER');
    const gameOverMsg = document.getElementById('game-over-msg');
    expect(gameOverMsg?.textContent).toBe('You ran into yourself!');
  });

  it('should prove interpolation does not affect food collision', () => {
    game.prepareGame();
    (game as any).state = 'PLAYING';

    (game.snake as any).body = [
      { x: 10, y: 10 },
      { x: 9, y: 10 }
    ];
    (game.snake as any).previousBody = [
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    // Interpolated positions are fractional
    const interpolated = game.snake.getInterpolatedBody(0.5);
    expect(interpolated[0]!.x).toBe(9.5);

    // Place food at (11, 10)
    (game.food as any).position = { x: 11, y: 10 };
    (game.snake as any).direction = 'RIGHT';
    (game.input as any).currentDirection = 'RIGHT';

    // Move RIGHT - tick compares integer coordinates only
    (game as any).tick();
    expect((game as any).score).toBe(10);
    expect(game.snake.getHead()).toEqual({ x: 11, y: 10 });
  });

  it('should prove resizing the renderer does not reset score', () => {
    game.prepareGame();
    (game as any).score = 30;

    game.renderer.resize();

    expect((game as any).score).toBe(30);
  });

  it('should stop additional catch-up ticks immediately when game-over is triggered', () => {
    game.prepareGame();
    game.startSimulation();

    // Position snake so it crashes into the wall
    (game.snake as any).body = [
      { x: BOARD_COLUMNS - 1, y: 5 },
      { x: BOARD_COLUMNS - 2, y: 5 }
    ];
    (game.snake as any).direction = 'RIGHT';
    (game.input as any).currentDirection = 'RIGHT';

    // Trigger loop execution with large delta (2 ticks worth)
    const mockTick = vi.spyOn(game as any, 'tick');
    const tickDelay = (game.loop as any).tickDelay;
    
    // Accumulate enough time for 2 ticks
    (game.loop as any).accumulator = tickDelay * 2;
    (game.loop as any).loop(performance.now());

    // First tick causes GAME_OVER and pauses. Second tick should NOT execute because isSimPaused becomes true.
    expect(mockTick).toHaveBeenCalledTimes(1);
    expect((game as any).state).toBe('GAME_OVER');

    mockTick.mockRestore();
  });
});
