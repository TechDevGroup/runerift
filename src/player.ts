import type { TileMap } from "./tilemap.ts";
import type { Input } from "./input.ts";

export interface PlayerOptions {
  tileX: number;
  tileY: number;
  color?: string;
}

/**
 * Player lives on tile coordinates and steps exactly one tile per keypress.
 * Movement is blocked by solid tiles (TileMap.isSolid).
 */
export class Player {
  tileX: number;
  tileY: number;
  readonly color: string;

  constructor(opts: PlayerOptions) {
    this.tileX = opts.tileX;
    this.tileY = opts.tileY;
    this.color = opts.color ?? "#e07a5f";
  }

  /** Edge-triggered: one tile per discrete WASD / arrow press. */
  handleInput(input: Input, map: TileMap): void {
    let dx = 0;
    let dy = 0;
    if (input.wasPressed("w") || input.wasPressed("arrowup")) dy = -1;
    else if (input.wasPressed("s") || input.wasPressed("arrowdown")) dy = 1;
    else if (input.wasPressed("a") || input.wasPressed("arrowleft")) dx = -1;
    else if (input.wasPressed("d") || input.wasPressed("arrowright")) dx = 1;

    if (dx === 0 && dy === 0) return;

    const nx = this.tileX + dx;
    const ny = this.tileY + dy;
    if (!map.isSolid(nx, ny)) {
      this.tileX = nx;
      this.tileY = ny;
    }
  }

  render(ctx: CanvasRenderingContext2D, tileSize: number, offsetX = 0, offsetY = 0): void {
    const pad = Math.floor(tileSize * 0.15);
    ctx.fillStyle = this.color;
    ctx.fillRect(
      offsetX + this.tileX * tileSize + pad,
      offsetY + this.tileY * tileSize + pad,
      tileSize - pad * 2,
      tileSize - pad * 2,
    );
  }
}
