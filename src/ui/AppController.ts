import { Game } from '../game/Game';
import { HomeScreen } from './HomeScreen';
import { GameScreen } from './GameScreen';

export class AppController {
  private game: Game;
  private homeScreen: HomeScreen;
  private gameScreen: GameScreen;
  private canvas: HTMLCanvasElement;
  private canvasContainer: HTMLElement;

  constructor() {
    const canvasEl = document.getElementById('game-canvas') as HTMLCanvasElement;
    const containerEl = document.getElementById('canvas-container');
    if (!canvasEl || !containerEl) {
      throw new Error('Required canvas or container elements not found');
    }
    this.canvas = canvasEl;
    this.canvasContainer = containerEl;

    // Instantiate game engine
    this.game = new Game(this.canvas);

    // Instantiate UI screens
    this.homeScreen = new HomeScreen();
    this.gameScreen = new GameScreen();

    this.initBindings();
    this.setupFooterYear();
    this.setupResizeListeners();

    // Show initial home screen
    this.homeScreen.show();
    this.gameScreen.hide();

    // Set initial audio UI
    this.gameScreen.updateSoundStatus(this.game.audio.isEnabled());
  }

  private initBindings(): void {
    // 1. Play Trigger Actions (Home -> Game)
    const playButtons = document.querySelectorAll('.play-now-trigger');
    playButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.transitionToGame();
      });
    });

    // 2. Game Screen Actions -> Game Engine Controls
    this.gameScreen.bindPause(() => this.game.togglePause());
    this.gameScreen.bindRestart(() => this.game.restartGame());
    this.gameScreen.bindHome(() => this.transitionToHome());
    this.gameScreen.bindStart(() => this.game.startSimulation());
    this.gameScreen.bindSoundToggle(() => {
      const enabled = this.game.toggleSoundSetting();
      this.gameScreen.updateSoundStatus(enabled);
    });

    // 3. Game Engine Events -> Game Screen UI Updates
    this.game.registerStateChange(state => {
      this.gameScreen.updateState(state);

      // If we go back to Home state from engine control (e.g. Escape key)
      if (state === 'HOME') {
        this.transitionToHome();
      }
    });

    this.game.registerScoreChange((score, best) => {
      this.gameScreen.updateScore(score, best);
    });

    // 4. Touch Gestures (swipe) registration on canvas
    this.game.input.initTouchListeners(this.canvasContainer);
  }

  private transitionToGame(): void {
    this.game.audio.playClick();
    this.homeScreen.hide();
    this.gameScreen.show();
    this.game.prepareGame();

    // Auto-focus canvas for instant keyboard responsiveness
    this.canvas.focus();

    // Handle Retina scaling / responsive fit
    this.game.renderer.resize();
  }

  private transitionToHome(): void {
    this.gameScreen.hide();
    this.homeScreen.show();
    this.game.setHomeScreen();
  }

  private setupFooterYear(): void {
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear().toString();
    }
  }

  private setupResizeListeners(): void {
    window.addEventListener('resize', () => {
      if (this.game.getState() !== 'HOME') {
        this.game.renderer.resize();
      }
    });

    // Orientation change handles canvas resize adjustments
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (this.game.getState() !== 'HOME') {
          this.game.renderer.resize();
        }
      }, 200);
    });
  }
}
