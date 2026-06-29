import type { ItemDefinition } from "./data/ItemDefinition.ts";
import { getItem } from "./data/ItemDefinition.ts";
import type { Inventory } from "./inventory.ts";

export interface ItemOptions {
  tileX: number;
  tileY: number;
  itemId: number; // Real OSRS item ID from cache
  quantity?: number;
  color?: string;
}

/**
 * A pickup resting on a tile. When the player steps onto its tile,
 * the item is added to their inventory.
 * Grounded to real OSRS cache data.
 */
export class Item {
  tileX: number;
  tileY: number;
  readonly itemId: number;
  readonly itemDef: ItemDefinition | undefined;
  readonly quantity: number;
  readonly color: string;

  constructor(opts: ItemOptions) {
    this.tileX = opts.tileX;
    this.tileY = opts.tileY;
    this.itemId = opts.itemId;
    this.itemDef = getItem(opts.itemId);
    this.quantity = opts.quantity ?? 1;
    
    // Default colors: coins gold, food red, equipment gray
    let defaultColor = "#9aa0a6";
    if (this.itemDef?.name.toLowerCase().includes("coin")) {
      defaultColor = "#f4c430";
    } else if (this.itemDef?.equipable) {
      defaultColor = "#8ab4f8";
    }
    this.color = opts.color ?? defaultColor;
  }

  /** Add this item to the player's inventory. Returns true if successful. */
  pickUp(inventory: Inventory): boolean {
    if (!this.itemDef) return false;
    return inventory.add(this.itemDef, this.quantity);
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
