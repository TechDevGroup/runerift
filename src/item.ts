import type { BarStat, StatsSource } from "./stats.ts";

export type ItemKind = "hp" | "mana";

export interface ItemOptions {
  tileX: number;
  tileY: number;
  kind: ItemKind;
  amount: number;
  color?: string;
}

/**
 * A pickup resting on a tile. When the player steps onto its tile the effect
 * is applied to the matching vital (hp or mana) and the item is consumed.
 */
export class Item {
  tileX: number;
  tileY: number;
  readonly kind: ItemKind;
  readonly amount: number;
  readonly color: string;

  constructor(opts: ItemOptions) {
    this.tileX = opts.tileX;
    this.tileY = opts.tileY;
    this.kind = opts.kind;
    this.amount = opts.amount;
    this.color = opts.color ?? (opts.kind === "hp" ? "#e63946" : "#457bd8");
  }

  /** Restore the matching vital on the target, clamped to its max. */
  applyTo(target: StatsSource): void {
    const stat: BarStat = this.kind === "hp" ? target.hp : target.mana;
    stat.current = Math.min(stat.max, stat.current + this.amount);
  }

  /** Drawn as a small diamond so pickups read differently from round NPCs. */
  render(ctx: CanvasRenderingContext2D, tileSize: number, offsetX = 0, offsetY = 0): void {
    const cx = offsetX + this.tileX * tileSize + tileSize / 2;
    const cy = offsetY + this.tileY * tileSize + tileSize / 2;
    const r = tileSize * 0.28;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
