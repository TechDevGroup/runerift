import type { BarStat } from "./stats.ts";

export interface EnemyOptions {
  tileX: number;
  tileY: number;
  npcId?: number; // Real OSRS NPC ID from cache
  name: string;
  hp?: number;
  maxHp?: number;
  attack?: number;
  strength?: number; // Real OSRS strength stat
  defence?: number;  // Real OSRS defence stat
  xp?: number;
  color?: string;
  aggroRange?: number;
  speed?: number;
}

/**
 * A hostile entity on a tile. The player attacks it from an adjacent tile;
 * it retaliates for `attack` damage. Removed from the world when hp hits 0.
 */
export class Enemy {
  tileX: number;
  tileY: number;
  readonly npcId?: number;
  readonly name: string;
  readonly hp: BarStat;
  readonly attack: number;
  readonly strength: number;
  readonly defence: number;
  readonly xp: number;
  readonly color: string;
  readonly aggroRange: number;
  readonly speed: number;
  private moveTimer = 0;

  constructor(opts: EnemyOptions) {
    this.tileX = opts.tileX;
    this.tileY = opts.tileY;
    this.npcId = opts.npcId;
    this.name = opts.name;
    this.hp = { current: opts.hp ?? 12, max: opts.maxHp ?? (opts.hp ?? 12) };
    this.attack = opts.attack ?? 4;
    this.strength = opts.strength ?? 1;
    this.defence = opts.defence ?? 1;
    this.xp = opts.xp ?? 5;
    this.color = opts.color ?? "#9b5de5";
    this.aggroRange = opts.aggroRange ?? 5;
    this.speed = opts.speed ?? 1.0;
  }

  /** Chebyshev adjacency — attackable from any of the 8 neighbouring tiles. */
  isAdjacentTo(tileX: number, tileY: number): boolean {
    return Math.abs(this.tileX - tileX) <= 1 && Math.abs(this.tileY - tileY) <= 1;
  }

  /** Apply damage; returns true if this blow was fatal. */
  takeDamage(amount: number): boolean {
    this.hp.current = Math.max(0, this.hp.current - amount);
    return this.hp.current === 0;
  }

  get isDead(): boolean {
    return this.hp.current === 0;
  }

  update(dt: number, playerX: number, playerY: number, isSolid: (x: number, y: number) => boolean): void {
    this.moveTimer -= dt;
    if (this.moveTimer > 0) return;

    const dx = playerX - this.tileX;
    const dy = playerY - this.tileY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= this.aggroRange && dist > 1) {
      this.moveTimer = 1.0 / this.speed;
      const stepX = Math.sign(dx);
      const stepY = Math.sign(dy);

      if (Math.abs(dx) > Math.abs(dy)) {
        const nx = this.tileX + stepX;
        if (!isSolid(nx, this.tileY)) {
          this.tileX = nx;
          return;
        }
      } else {
        const ny = this.tileY + stepY;
        if (!isSolid(this.tileX, ny)) {
          this.tileY = ny;
          return;
        }
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        const ny = this.tileY + stepY;
        if (!isSolid(this.tileX, ny)) {
          this.tileY = ny;
        }
      } else {
        const nx = this.tileX + stepX;
        if (!isSolid(nx, this.tileY)) {
          this.tileX = nx;
        }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, tileSize: number, offsetX = 0, offsetY = 0): void {
    const pad = Math.floor(tileSize * 0.18);
    const x = offsetX + this.tileX * tileSize + pad;
    const y = offsetY + this.tileY * tileSize + pad;
    const size = tileSize - pad * 2;

    ctx.fillStyle = this.color;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    this.renderHealthBar(ctx, offsetX, offsetY, tileSize);
  }

  /** Thin hp bar floating just above the enemy so hits read at a glance. */
  private renderHealthBar(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    offsetY: number,
    tileSize: number,
  ): void {
    const barW = tileSize * 0.8;
    const barH = 3;
    const bx = offsetX + this.tileX * tileSize + (tileSize - barW) / 2;
    const by = offsetY + this.tileY * tileSize - barH - 2;
    const ratio = this.hp.max > 0 ? Math.max(0, this.hp.current / this.hp.max) : 0;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = "#e63946";
    ctx.fillRect(bx, by, barW * ratio, barH);
  }
}
