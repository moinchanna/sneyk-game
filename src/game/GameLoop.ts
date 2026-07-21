export class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private tickDelay = 150; // ms per tick
  private rafId: number | null = null;
  private isRunning = false;
  private isSimPaused = false;

  private onTickCallback: () => void;
  private onRenderCallback: () => void;

  constructor(onTick: () => void, onRender: () => void) {
    this.onTickCallback = onTick;
    this.onRenderCallback = onRender;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isSimPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public setSpeed(delayMs: number): void {
    this.tickDelay = delayMs;
  }

  public pauseSimulation(): void {
    this.isSimPaused = true;
  }

  public resumeSimulation(): void {
    this.isSimPaused = false;
    this.lastTime = performance.now(); // Reset lastTime to avoid huge delta jumps
  }

  private loop = (timestamp: number): void => {
    if (!this.isRunning) return;

    let delta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Cap delta at 1 second to prevent excessive simulation catchup spikes
    // (e.g. if the tab was suspended or machine went to sleep)
    if (delta > 1000) {
      delta = this.tickDelay;
    }

    if (!this.isSimPaused) {
      this.accumulator += delta;
      
      while (this.accumulator >= this.tickDelay) {
        this.onTickCallback();
        this.accumulator -= this.tickDelay;
      }
    }

    // Always render every frame to support screen refreshes, particle animations, glows, etc.
    this.onRenderCallback();

    this.rafId = requestAnimationFrame(this.loop);
  };
}
