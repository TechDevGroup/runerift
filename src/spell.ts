import type { Enemy } from "./enemy.ts";
import type { Player } from "./player.ts";

export interface SpellDefinition {
  name: string;
  manaCost: number;
  damage: number;
  range: number;
  color: string;
}

export const SPELLS: Record<string, SpellDefinition> = {
  fireball: {
    name: "Fireball",
    manaCost: 5,
    damage: 8,
    range: 4,
    color: "#ff6b35",
  },
  icebolt: {
    name: "Ice Bolt",
    manaCost: 3,
    damage: 5,
    range: 5,
    color: "#4ecdc4",
  },
};

export interface SpellProjectile {
  spell: SpellDefinition;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  lifetime: number;
}

export class SpellSystem {
  private projectiles: SpellProjectile[] = [];

  cast(spell: SpellDefinition, caster: Player, targetTileX: number, targetTileY: number): boolean {
    if (caster.mana.current < spell.manaCost) return false;

    const dx = targetTileX - caster.tileX;
    const dy = targetTileY - caster.tileY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > spell.range) return false;

    caster.mana.current = Math.max(0, caster.mana.current - spell.manaCost);

    this.projectiles.push({
      spell,
      x: caster.tileX + 0.5,
      y: caster.tileY + 0.5,
      targetX: targetTileX + 0.5,
      targetY: targetTileY + 0.5,
      speed: 8,
      lifetime: 2,
    });

    return true;
  }

  update(dt: number, enemies: Enemy[], onHit: (enemy: Enemy, damage: number) => void): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.lifetime -= dt;

      if (proj.lifetime <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const dx = proj.targetX - proj.x;
      const dy = proj.targetY - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.1) {
        this.checkHit(proj, enemies, onHit);
        this.projectiles.splice(i, 1);
        continue;
      }

      const step = Math.min(proj.speed * dt, dist);
      proj.x += (dx / dist) * step;
      proj.y += (dy / dist) * step;
    }
  }

  private checkHit(proj: SpellProjectile, enemies: Enemy[], onHit: (enemy: Enemy, damage: number) => void): void {
    const hitX = Math.floor(proj.targetX);
    const hitY = Math.floor(proj.targetY);

    for (const enemy of enemies) {
      if (enemy.tileX === hitX && enemy.tileY === hitY) {
        onHit(enemy, proj.spell.damage);
        break;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, tileSize: number, offsetX: number, offsetY: number): void {
    for (const proj of this.projectiles) {
      const px = offsetX + proj.x * tileSize;
      const py = offsetY + proj.y * tileSize;
      const radius = tileSize * 0.15;

      ctx.fillStyle = proj.spell.color;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
