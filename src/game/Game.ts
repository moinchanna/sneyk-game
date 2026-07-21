import { GameState, GameSettings, Position } from './types';
import { Snake } from './Snake';
import { Food } from './Food';
import { InputManager } from './InputManager';
import { Renderer } from './Renderer';
import { AudioManager } from './AudioManager';
import { GameLoop } from './GameLoop';
import { Storage } from './Storage';
import {
  GRID_CELLS,
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
    this.snake = new Snake(GRID_CELLS, INITIAL_SNAKE_LENGTH);
    // Initialize food off-screen or empty, it will be placed on ready
    this.food = new Food(this.snake.getBody(), GRID_CELLS);
    
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

    this.snake.reset(GRID_CELLS, INITIAL_SNAKE_LENGTH);
    this.food.spawn(this.snake.getBody(), GRID_CELLS);
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
    this.input.onDirectionInput((_dir) => {
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

    // Get next buffered direction
    const nextDir = this.input.nextDirection();
    
    // Move the snake
    this.snake.move(nextDir);

    // Check collisions
    if (this.snake.checkWallCollision(GRID_CELLS)) {
      this.triggerGameOver('You crashed into the wall!');
      return;
    }

    if (this.snake.checkSelfCollision()) {
      this.triggerGameOver('You bit your own tail!');
      return;
    }

    // Check if food was eaten
    const head = this.snake.getHead();
    const foodPos = this.food.getPosition();

    if (head.x === foodPos.x && head.y === foodPos.y) {
      this.handleFoodEaten(foodPos);
    }
  }

  private handleFoodEaten(pos: Position): void {
    this.snake.grow();
    
    // Add score
    this.score += 10;
    this.notifyScore();

    // Sound effect
    this.audio.playEat();

    // Spawn particles
    this.renderer.spawnParticles(pos, '#ff3b30');

    // Spawn new food
    const spawned = this.food.spawn(this.snake.getBody(), GRID_CELLS);
    if (!spawned) {
      // Grid is full! Snake filled the entire board
      this.triggerGameOver('Congratulations! You filled the grid!');
      return;
    }

    // Boost speed
    this.currentSpeed = Math.max(MIN_SPEED, this.currentSpeed - SPEED_INCREMENT);
    this.loop.setSpeed(this.currentSpeed);

    this.announceAccessibility(`Score: ${this.score}`);
  }

  private triggerGameOver(msg: string): void {
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
    const gameOverMsg = document.getElementById('game-over-msg');
    if (gameOverMsg) {
      gameOverMsg.textContent = msg;
    }

    this.announceAccessibility(`Game over. Final score: ${this.score}. ${msg}`);
  }

  private render(): void {
    this.renderer.render(this.snake, this.food, this.state);
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
