import { Direction } from './types';
import { OPPOSITE_DIRECTIONS } from './constants';

export class InputManager {
  private directionQueue: Direction[] = [];
  private currentDirection: Direction = 'RIGHT';
  private touchStartX = 0;
  private touchStartY = 0;
  private minSwipeDistance = 30; // pixels

  // Callbacks
  private onDirectionCallbacks: ((dir: Direction) => void)[] = [];
  private onPauseCallback: (() => void) | null = null;
  private onRestartCallback: (() => void) | null = null;
  private onHomeCallback: (() => void) | null = null;

  constructor() {
    this.initKeyboardListeners();
  }

  public initTouchListeners(element: HTMLElement): void {
    element.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        const firstTouch = e.touches[0];
        if (firstTouch) {
          this.touchStartX = firstTouch.clientX;
          this.touchStartY = firstTouch.clientY;
        }
      },
      { passive: true }
    );

    element.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        // Prevent scrolling ONLY if playing inside the game area
        // We handle event cancellation in active touchmove to avoid scroll actions.
        if (e.cancelable) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    element.addEventListener(
      'touchend',
      (e: TouchEvent) => {
        const lastTouch = e.changedTouches[0];
        if (!lastTouch) return;

        const deltaX = lastTouch.clientX - this.touchStartX;
        const deltaY = lastTouch.clientY - this.touchStartY;

        if (Math.abs(deltaX) < this.minSwipeDistance && Math.abs(deltaY) < this.minSwipeDistance) {
          return; // Did not exceed threshold
        }

        let swipeDir: Direction | null = null;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          swipeDir = deltaX > 0 ? 'RIGHT' : 'LEFT';
        } else {
          // Vertical swipe
          swipeDir = deltaY > 0 ? 'DOWN' : 'UP';
        }

        if (swipeDir) {
          this.handleDirectionInput(swipeDir);
        }
      },
      { passive: true }
    );
  }

  private initKeyboardListeners(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Prevent defaults for gameplay keys when focusing or active
      const gameplayKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'p', 'P', 'r', 'R', 'Escape', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'];
      if (gameplayKeys.includes(e.key)) {
        // Only prevent scrolling with Space or Arrow keys to keep normal form controls working elsewhere
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
          e.preventDefault();
        }
      }

      switch (e.key) {
        // Direction Up
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.handleDirectionInput('UP');
          break;
        // Direction Down
        case 'ArrowDown':
        case 's':
        case 'S':
          this.handleDirectionInput('DOWN');
          break;
        // Direction Left
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.handleDirectionInput('LEFT');
          break;
        // Direction Right
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.handleDirectionInput('RIGHT');
          break;
        // System controls
        case ' ':
        case 'p':
        case 'P':
          if (this.onPauseCallback) this.onPauseCallback();
          break;
        case 'r':
        case 'R':
          if (this.onRestartCallback) this.onRestartCallback();
          break;
        case 'Escape':
          if (this.onHomeCallback) this.onHomeCallback();
          break;
      }
    });
  }

  private handleDirectionInput(dir: Direction): void {
    // Get the last requested direction in queue or current direction
    const lastRequested = this.directionQueue.length > 0 
      ? this.directionQueue[this.directionQueue.length - 1] 
      : this.currentDirection;

    // Check if the requested direction is the opposite of the last requested direction (illegal 180 turn)
    if (lastRequested && OPPOSITE_DIRECTIONS[dir] === lastRequested) {
      return;
    }

    // Limit buffer size to 2 to prevent excessive lag in inputs
    if (this.directionQueue.length < 2) {
      this.directionQueue.push(dir);
      
      // Notify direction change callbacks (e.g. to start the game)
      this.onDirectionCallbacks.forEach(cb => cb(dir));
    }
  }

  /**
   * Called by the game tick to consume the next buffered direction
   */
  public nextDirection(): Direction {
    const nextDir = this.directionQueue.shift();
    if (nextDir) {
      this.currentDirection = nextDir;
    }
    return this.currentDirection;
  }

  public getBufferLength(): number {
    return this.directionQueue.length;
  }

  public reset(initialDir: Direction = 'RIGHT'): void {
    this.directionQueue = [];
    this.currentDirection = initialDir;
  }

  // Register Callbacks
  public onDirectionInput(callback: (dir: Direction) => void): void {
    this.onDirectionCallbacks.push(callback);
  }

  public onPause(callback: () => void): void {
    this.onPauseCallback = callback;
  }

  public onRestart(callback: () => void): void {
    this.onRestartCallback = callback;
  }

  public onHome(callback: () => void): void {
    this.onHomeCallback = callback;
  }
}
