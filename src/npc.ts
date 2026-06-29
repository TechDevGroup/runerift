import type { Quest } from "./quest.ts";
import type { Shop } from "./shop.ts";
import { getNpc, type NpcDefinition } from "./data/NpcDefinition.ts";

export interface NpcOptions {
  tileX: number;
  tileY: number;
  npcId?: number; // Real OSRS NPC ID from cache
  name?: string; // Override cache name if needed
  dialogue?: string;
  color?: string;
  quest?: Quest;
  shop?: Shop;
}

/**
 * A non-player character standing on a tile. Holds a name and a line of
 * dialogue surfaced when the player interacts from an adjacent tile.
 * Can be grounded to real OSRS cache data via npcId.
 */
export class Npc {
  tileX: number;
  tileY: number;
  readonly npcId?: number;
  readonly npcDef?: NpcDefinition;
  readonly name: string;
  readonly dialogue: string;
  readonly color: string;
  readonly quest?: Quest;
  readonly shop?: Shop;

  constructor(opts: NpcOptions) {
    this.tileX = opts.tileX;
    this.tileY = opts.tileY;
    this.npcId = opts.npcId;
    
    // Load from cache if npcId provided
    if (opts.npcId !== undefined) {
      this.npcDef = getNpc(opts.npcId);
    }
    
    // Use cache name or override
    this.name = opts.name ?? this.npcDef?.name ?? "Unknown NPC";
    this.dialogue = opts.dialogue ?? this.npcDef?.examine ?? "...";
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
