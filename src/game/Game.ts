import { GameState, GameOverReason, GameSettings, Position } from './types';
import { Snake } from './Snake';
import { Food } from './Food';
import { InputManager } from './InputManager';
import { Renderer } from './Renderer';
import { AudioManager } from './AudioManager';
import { GameLoop } from './GameLoop';
import { Storage } from './Storage';
import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  INITIAL_SPEED,
  MIN_SPEED,
  SPEED_INCREMENT,
  INITIAL_SNAKE_LENGTH
} from './constants';

export class Game {
  private state: GameState = 'HOME';
  private score = 0;
  private bestScore = 0;
  private currentSpeed = INITIAL_SPEED;

  public snake: Snake;
  public food: Food;
  public input: InputManager;
  public renderer: Renderer;
  public audio: AudioManager;
  public loop: GameLoop;

  // UI callbacks
  private onStateChangeCallback: ((state: GameState) => void) | null = null;
  private onScoreChangeCallback: ((score: number, best: number) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.snake = new Snake(BOARD_COLUMNS, BOARD_ROWS, INITIAL_SNAKE_LENGTH);
    this.food = new Food(this.snake.getBody(), BOARD_COLUMNS, BOARD_ROWS);

    this.input = new InputManager();
    this.renderer = new Renderer(canvas);
    this.audio = new AudioManager();
    this.bestScore = Storage.getBestScore();

    this.loop = new GameLoop(
      () => this.tick(),
      () => this.render()
    );

    this.initInputBindings();
    this.initVisibilityListeners();
  }

  public getSettings(): GameSettings {
    return {
      soundEnabled: this.audio.isEnabled(),
      reducedMotion: Storage.getReducedMotionPreference()
    };
  }

  public toggleSoundSetting(): boolean {
    const status = this.audio.toggleSound();
    this.renderer.updateSettings({ soundEnabled: status });
    return status;
  }

  public setReducedMotionSetting(enabled: boolean): void {
    Storage.saveReducedMotionPreference(enabled);
    this.renderer.updateSettings({ reducedMotion: enabled });
  }

  public registerStateChange(cb: (state: GameState) => void): void {
    this.onStateChangeCallback = cb;
    cb(this.state); // Initial emission
  }

  public registerScoreChange(cb: (score: number, best: number) => void): void {
    this.onScoreChangeCallback = cb;
    cb(this.score, this.bestScore); // Initial emission
  }

  public getState(): GameState {
    return this.state;
  }

  public getScore(): number {
    return this.score;
  }

  public getBestScore(): number {
    return this.bestScore;
  }

  public setHomeScreen(): void {
    this.setState('HOME');
    this.loop.stop();
    this.renderer.resetParticles();
    this.renderer.clear();
  }

  /**
   * Reset game objects and put them in the READY state waiting for input
   */
  public prepareGame(): void {
    this.score = 0;
    this.bestScore = Storage.getBestScore();
    this.currentSpeed = INITIAL_SPEED;

    this.snake.reset(BOARD_COLUMNS, BOARD_ROWS, INITIAL_SNAKE_LENGTH);
    this.food.spawn(this.snake.getBody(), BOARD_COLUMNS, BOARD_ROWS);
    this.input.reset();

    this.loop.setSpeed(this.currentSpeed);
    this.renderer.resetParticles();

    this.setState('READY');

    // Start game loop rendering, but pause the simulation accumulator
    this.loop.start();
    this.loop.pauseSimulation();

    this.notifyScore();
  }

  public startSimulation(): void {
    if (this.state !== 'READY') return;
    this.setState('PLAYING');
    this.loop.resumeSimulation();
    this.announceAccessibility('Game started');
  }

  public togglePause(): void {
    if (this.state === 'PLAYING') {
      this.setState('PAUSED');
      this.loop.pauseSimulation();
      this.audio.playClick();
      this.announceAccessibility('Game paused');
    } else if (this.state === 'PAUSED') {
      this.setState('PLAYING');
      this.loop.resumeSimulation();
      this.audio.playClick();
      this.announceAccessibility('Game resumed');
    }
  }

  public restartGame(): void {
    this.audio.playClick();
    this.prepareGame();
  }

  private setState(state: GameState): void {
    this.state = state;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(state);
    }
  }

  private initInputBindings(): void {
    // When directions are input, automatically start the game if in READY state
    this.input.onDirectionInput(_dir => {
      if (this.state === 'READY') {
        this.startSimulation();
      }
    });

    this.input.onPause(() => {
      if (this.state === 'PLAYING' || this.state === 'PAUSED') {
        this.togglePause();
      }
    });

    this.input.onRestart(() => {
      if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'GAME_OVER') {
        this.restartGame();
      }
    });

    this.input.onHome(() => {
      this.audio.playClick();
      this.setHomeScreen();
    });
  }

  private initVisibilityListeners(): void {
    const handleAutoPause = () => {
      if (this.state === 'PLAYING') {
        this.togglePause();
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        handleAutoPause();
      }
    });

    window.addEventListener('blur', handleAutoPause);
  }

  private tick(): void {
    if (this.state !== 'PLAYING') return;

    // 1. Read current/next buffered direction
    const nextDir = this.input.nextDirection();

    // 2. Calculate nextHead
    const nextHead = this.snake.getNextHead(nextDir);

    // 3. Check whether nextHead is outside the board
    const outsideBoard =
      nextHead.x < 0 ||
      nextHead.x >= BOARD_COLUMNS ||
      nextHead.y < 0 ||
      nextHead.y >= BOARD_ROWS;

    if (outsideBoard) {
      this.triggerGameOver('wall');
      return;
    }

    // 5. Check whether nextHead equals the food
    const foodPos = this.food.getPosition();
    const ateFood = nextHead.x === foodPos.x && nextHead.y === foodPos.y;

    // 4. Check whether nextHead collides with the snake
    if (this.snake.willCollideWithSelf(nextHead, ateFood)) {
      this.triggerGameOver('self');
      return;
    }

    // 6. Commit exactly one logical move
    this.snake.commitMove(nextHead, nextDir, ateFood);

    // 7. Apply growth and score if food was eaten
    if (ateFood) {
      this.handleFoodEaten(nextHead);
    }
  }

  private handleFoodEaten(pos: Position): void {
    // Add score
    this.score += 10;

    // Update best score immediately if it exceeds the current best
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      Storage.saveBestScore(this.bestScore);
    }

    this.notifyScore();

    // Sound effect
    this.audio.playEat();

    // Spawn particles
    this.renderer.spawnParticles(pos, '#ff3b30');

    // Spawn new food
    const spawned = this.food.spawn(this.snake.getBody(), BOARD_COLUMNS, BOARD_ROWS);
    if (!spawned) {
      // Grid is full! Snake filled the entire board
      this.triggerGameOver('win');
      return;
    }

    // Boost speed
    this.currentSpeed = Math.max(MIN_SPEED, this.currentSpeed - SPEED_INCREMENT);
    this.loop.setSpeed(this.currentSpeed);

    this.announceAccessibility(`Score: ${this.score}`);
  }

  private triggerGameOver(reason: GameOverReason): void {
    this.setState('GAME_OVER');
    this.loop.pauseSimulation();

    // Play Game Over Sound
    this.audio.playGameOver();

    // Trigger visual screen pulse (red flash)
    const container = document.getElementById('canvas-container');
    if (container) {
      container.classList.remove('screen-pulse');
      // Trigger reflow to restart animation
      void container.offsetWidth;
      container.classList.add('screen-pulse');
    }

    // Save best score to storage
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      Storage.saveBestScore(this.bestScore);
    }

    this.notifyScore();

    // Set message details in UI
    let msg = 'Game Over';
    if (reason === 'wall') {
      msg = 'You crashed into the wall!';
    } else if (reason === 'self') {
      msg = 'You ran into yourself!';
    } else if (reason === 'win') {
      msg = 'Congratulations! You filled the grid!';
    }

    const gameOverMsg = document.getElementById('game-over-msg');
    if (gameOverMsg) {
      gameOverMsg.textContent = msg;
    }

    this.announceAccessibility(`Game over. Final score: ${this.score}. ${msg}`);
  }

  private render(): void {
    const alpha = this.loop.getInterpolationAlpha();
    this.renderer.render(this.snake, this.food, this.state, alpha);
  }

  private notifyScore(): void {
    if (this.onScoreChangeCallback) {
      this.onScoreChangeCallback(this.score, this.bestScore);
    }
  }

  private announceAccessibility(text: string): void {
    const announcer = document.getElementById('announcer');
    if (announcer) {
      announcer.textContent = text;
    }
  }
}
