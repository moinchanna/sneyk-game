export class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private tickDelay = 72; // ms per tick (default FAST)
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
    this.lastTime = performance.now(); // Reset lastTime to avoid delta jumps
    this.accumulator = 0; // Clear accumulator backlog
  }

  public getInterpolationAlpha(): number {
    if (this.isSimPaused) return 0;
    return Math.max(0, Math.min(1.0, this.accumulator / this.tickDelay));
  }

  private loop = (timestamp: number): void => {
    if (!this.isRunning) return;

    let delta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Cap frame delta at 80ms to prevent huge simulation catchup spikes
    delta = Math.min(delta, 80);

    if (!this.isSimPaused) {
      this.accumulator += delta;

      let updates = 0;
      while (this.accumulator >= this.tickDelay && !this.isSimPaused) {
        this.onTickCallback();
        this.accumulator -= this.tickDelay;
        updates++;

        // Limit catch-up updates per frame to 2 to stay stable under load
        if (updates >= 2) {
          this.accumulator = 0; // Clear remaining backlog
          break;
        }
      }
    }

    // Always render every frame to support screen refreshes, smooth interpolation, particles, etc.
    this.onRenderCallback();

    this.rafId = requestAnimationFrame(this.loop);
  };
}
