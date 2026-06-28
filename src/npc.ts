import type { Quest } from "./quest.ts";
import type { Shop } from "./shop.ts";

export interface NpcOptions {
  tileX: number;
  tileY: number;
  name: string;
  dialogue: string;
  color?: string;
  quest?: Quest;
  shop?: Shop;
}

/**
 * A non-player character standing on a tile. Holds a name and a line of
 * dialogue surfaced when the player interacts from an adjacent tile.
 */
export class Npc {
  tileX: number;
  tileY: number;
  readonly name: string;
  readonly dialogue: string;
  readonly color: string;
  readonly quest?: Quest;
  readonly shop?: Shop;

  constructor(opts: NpcOptions) {
    this.tileX = opts.tileX;
    this.tileY = opts.tileY;
    this.name = opts.name;
    this.dialogue = opts.dialogue;
    this.color = opts.color ?? "#f2cc8f";
    this.quest = opts.quest;
    this.shop = opts.shop;
  }

  /** Chebyshev adjacency (includes the NPC's own tile and diagonals). */
  isAdjacentTo(tileX: number, tileY: number): boolean {
    return Math.abs(this.tileX - tileX) <= 1 && Math.abs(this.tileY - tileY) <= 1;
  }

  render(ctx: CanvasRenderingContext2D, tileSize: number, offsetX = 0, offsetY = 0): void {
    const cx = offsetX + this.tileX * tileSize + tileSize / 2;
    const cy = offsetY + this.tileY * tileSize + tileSize / 2;
    const r = tileSize * 0.35;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
