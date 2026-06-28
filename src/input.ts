/**
 * Keyboard state tracker. Records which keys are currently held and which
 * were pressed this frame (edge-triggered), so movement can be tile-stepped
 * rather than continuous.
 */
export class Input {
  private held = new Set<string>();
  private pressed = new Set<string>();
  private mouseClick: { x: number; y: number } | null = null;

  constructor(target: Window = window, canvas?: HTMLCanvasElement) {
    target.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (!this.held.has(k)) this.pressed.add(k);
      this.held.add(k);
    });
    target.addEventListener("keyup", (e) => {
      this.held.delete(e.key.toLowerCase());
    });
    if (canvas) {
      canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        this.mouseClick = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      });
    }
  }

  isHeld(key: string): boolean {
    return this.held.has(key.toLowerCase());
  }

  /** True once per physical press until the key is released and pressed again. */
  wasPressed(key: string): boolean {
    return this.pressed.has(key.toLowerCase());
  }

  /** Returns mouse click in canvas pixels this frame, or null. */
  getMouseClick(): { x: number; y: number } | null {
    return this.mouseClick;
  }

  /** Call at the end of each frame to clear edge-triggered presses. */
  endFrame(): void {
    this.pressed.clear();
    this.mouseClick = null;
  }
}
