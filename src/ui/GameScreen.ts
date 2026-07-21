import { GameState } from '../game/types';

export class GameScreen {
  private container: HTMLElement;
  private currentScoreEl: HTMLElement;
  private bestScoreEl: HTMLElement;
  private btnSound: HTMLElement;
  private svgSoundOn: HTMLElement;
  private svgSoundOff: HTMLElement;
  private btnPause: HTMLElement;
  private btnRestart: HTMLElement;
  private btnHome: HTMLElement;

  // Overlays
  private readyOverlay: HTMLElement;
  private pauseOverlay: HTMLElement;
  private gameOverOverlay: HTMLElement;
  
  // Overlay interactive elements
  private btnOverlayResume: HTMLElement;
  private btnOverlayRestart: HTMLElement;
  private btnOverlayPlayAgain: HTMLElement;
  private btnOverlayHome: HTMLElement;
  private btnStartMobile: HTMLElement;

  // Game over text nodes
  private finalScoreEl: HTMLElement;
  private finalBestEl: HTMLElement;

  // Click handler callbacks
  private onPauseTriggered: (() => void) | null = null;
  private onRestartTriggered: (() => void) | null = null;
  private onHomeTriggered: (() => void) | null = null;
  private onSoundToggleTriggered: (() => void) | null = null;
  private onStartTriggered: (() => void) | null = null;

  constructor() {
    const screen = document.getElementById('game-screen');
    const curScore = document.getElementById('current-score');
    const bestScore = document.getElementById('best-score');
    const soundBtn = document.getElementById('btn-sound');
    const pauseBtn = document.getElementById('btn-pause');
    const restartBtn = document.getElementById('btn-restart');
    const homeBtn = document.getElementById('btn-home');

    // SVGs
    const soundOn = document.getElementById('svg-sound-on');
    const soundOff = document.getElementById('svg-sound-off');

    // Overlays
    const readyOver = document.getElementById('ready-overlay');
    const pauseOver = document.getElementById('pause-overlay');
    const gameOverOver = document.getElementById('game-over-overlay');

    // Overlay buttons
    const overlayResume = document.getElementById('btn-overlay-resume');
    const overlayRestart = document.getElementById('btn-overlay-restart');
    const overlayPlayAgain = document.getElementById('btn-overlay-play-again');
    const overlayHome = document.getElementById('btn-overlay-home');
    const startMobile = document.getElementById('btn-start-game-mobile');

    // Final scores
    const finalScore = document.getElementById('final-score');
    const finalBest = document.getElementById('final-best');

    if (
      !screen || !curScore || !bestScore || !soundBtn || !pauseBtn || !restartBtn || !homeBtn ||
      !soundOn || !soundOff || !readyOver || !pauseOver || !gameOverOver ||
      !overlayResume || !overlayRestart || !overlayPlayAgain || !overlayHome || !startMobile ||
      !finalScore || !finalBest
    ) {
      throw new Error('Game screen element selection failed');
    }

    this.container = screen;
    this.currentScoreEl = curScore;
    this.bestScoreEl = bestScore;
    this.btnSound = soundBtn;
    this.svgSoundOn = soundOn;
    this.svgSoundOff = soundOff;
    this.btnPause = pauseBtn;
    this.btnRestart = restartBtn;
    this.btnHome = homeBtn;

    this.readyOverlay = readyOver;
    this.pauseOverlay = pauseOver;
    this.gameOverOverlay = gameOverOver;

    this.btnOverlayResume = overlayResume;
    this.btnOverlayRestart = overlayRestart;
    this.btnOverlayPlayAgain = overlayPlayAgain;
    this.btnOverlayHome = overlayHome;
    this.btnStartMobile = startMobile;

    this.finalScoreEl = finalScore;
    this.finalBestEl = finalBest;

    this.setupEventListeners();
    this.setupTouchDetectForMobile();
  }

  public show(): void {
    this.container.classList.remove('hidden');
  }

  public hide(): void {
    this.container.classList.add('hidden');
    this.hideAllOverlays();
  }

  public updateScore(score: number, best: number): void {
    this.currentScoreEl.textContent = score.toString();
    this.bestScoreEl.textContent = best.toString();
    this.finalScoreEl.textContent = score.toString();
    this.finalBestEl.textContent = best.toString();
  }

  public updateSoundStatus(enabled: boolean): void {
    if (enabled) {
      this.svgSoundOn.classList.remove('hidden');
      this.svgSoundOff.classList.add('hidden');
      this.btnSound.setAttribute('aria-label', 'Mute Sound');
    } else {
      this.svgSoundOn.classList.add('hidden');
      this.svgSoundOff.classList.remove('hidden');
      this.btnSound.setAttribute('aria-label', 'Unmute Sound');
    }
  }

  public updateState(state: GameState): void {
    this.hideAllOverlays();

    switch (state) {
      case 'READY':
        this.readyOverlay.classList.add('active');
        this.btnPause.setAttribute('disabled', 'true');
        this.btnRestart.setAttribute('disabled', 'true');
        break;
      case 'PLAYING':
        this.btnPause.removeAttribute('disabled');
        this.btnRestart.removeAttribute('disabled');
        break;
      case 'PAUSED':
        this.pauseOverlay.classList.add('active');
        break;
      case 'GAME_OVER':
        this.gameOverOverlay.classList.add('active');
        break;
    }
  }

  private hideAllOverlays(): void {
    this.readyOverlay.classList.remove('active');
    this.pauseOverlay.classList.remove('active');
    this.gameOverOverlay.classList.remove('active');
  }

  private setupEventListeners(): void {
    // Top right HUD actions
    this.btnPause.addEventListener('click', () => this.onPauseTriggered?.());
    this.btnRestart.addEventListener('click', () => this.onRestartTriggered?.());
    this.btnHome.addEventListener('click', () => this.onHomeTriggered?.());
    this.btnSound.addEventListener('click', () => this.onSoundToggleTriggered?.());

    // Overlay button actions
    this.btnOverlayResume.addEventListener('click', () => this.onPauseTriggered?.());
    this.btnOverlayRestart.addEventListener('click', () => this.onRestartTriggered?.());
    this.btnOverlayPlayAgain.addEventListener('click', () => this.onRestartTriggered?.());
    this.btnOverlayHome.addEventListener('click', () => this.onHomeTriggered?.());
    this.btnStartMobile.addEventListener('click', () => this.onStartTriggered?.());
  }

  private setupTouchDetectForMobile(): void {
    // Show the mobile tap-to-start action button if we are on a touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      this.btnStartMobile.classList.remove('hidden');
      const promptText = document.getElementById('ready-prompt-text');
      if (promptText) {
        promptText.textContent = 'Swipe on the grid or tap start to play';
      }
    }
  }

  // Register state bindings
  public bindPause(cb: () => void): void { this.onPauseTriggered = cb; }
  public bindRestart(cb: () => void): void { this.onRestartTriggered = cb; }
  public bindHome(cb: () => void): void { this.onHomeTriggered = cb; }
  public bindSoundToggle(cb: () => void): void { this.onSoundToggleTriggered = cb; }
  public bindStart(cb: () => void): void { this.onStartTriggered = cb; }
}
