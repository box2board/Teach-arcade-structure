// Engine-independent countdown and run summary, shared by the arcade HUD and tests.
export class PlayFlow {
  constructor() {
    this.reset();
  }
  reset() {
    this.remaining = 3;
    this.running = false;
    this.paused = false;
    this.finished = false;
    this.peak = 0;
    this.time = 0;
    this.goTime = 0;
  }
  tick(dt, speed = 0) {
    if (this.paused || this.finished) return false;
    if (!this.running) {
      this.remaining = Math.max(0, this.remaining - dt);
      if (this.remaining === 0) {
        this.running = true;
        this.goTime = 0.6;
      }
      return false;
    }
    this.goTime = Math.max(0, this.goTime - dt);
    this.time += dt;
    this.peak = Math.max(this.peak, speed);
    return true;
  }
  finish(time = this.time) {
    if (this.finished) return false;
    this.finished = true;
    this.time = time;
    return true;
  }
  get label() {
    return this.finished
      ? "FINISH!"
      : this.paused
        ? "PAUSED"
        : !this.running
          ? String(Math.ceil(this.remaining))
          : this.goTime > 0
            ? "GO!"
            : "";
  }
}
