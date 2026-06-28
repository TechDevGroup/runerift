/**
 * Keyboard state tracker. Records which keys are currently held and which
 * were pressed this frame (edge-triggered), so movement can be tile-stepped
 * rather than continuous.
 */
export class Input {
  private held = new Set<string>();
  private pressed = new Set<string>();

  constructor(target: Window = window) {
    target.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (!this.held.has(k)) this.pressed.add(k);
      this.held.add(k);
    });
    target.addEventListener("keyup", (e) => {
      this.held.delete(e.key.toLowerCase());
    });
  }

  isHeld(key: string): boolean {
    return this.held.has(key.toLowerCase());
  }

  /** True once per physical press until the key is released and pressed again. */
  wasPressed(key: string): boolean {
    return this.pressed.has(key.toLowerCase());
  }

  /** Call at the end of each frame to clear edge-triggered presses. */
  endFrame(): void {
    this.pressed.clear();
  }
}
