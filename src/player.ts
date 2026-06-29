import type { TileMap } from "./tilemap.ts";
import type { Input } from "./input.ts";
import type { BarStat, StatsSource, EquippedGear } from "./stats.ts";
import { Inventory } from "./inventory.ts";
import { QuestLog } from "./quest.ts";
import { SkillManager } from "./skills.ts";
import { rollMeleeDamage } from "./combat.ts";
import { getEquipmentStats } from "./data/ItemDefinition.ts";

export interface PlayerOptions {
  tileX: number;
  tileY: number;
  color?: string;
  hp?: number;
  maxHp?: number;
  mana?: number;
  maxMana?: number;
  attackLevel?: number;
  strengthLevel?: number;
  defenceLevel?: number;
  level?: number;
  xp?: number;
  gold?: number;
}

/**
 * Player lives on tile coordinates and steps exactly one tile per keypress.
 * Movement is blocked by solid tiles (TileMap.isSolid).
 */
export class Player implements StatsSource {
  tileX: number;
  tileY: number;
  readonly color: string;
  readonly hp: BarStat;
  readonly mana: BarStat;
  attackLevel: number;
  strengthLevel: number;
  defenceLevel: number;
  level: number;
  xp: number;
  gold: number;
  readonly inventory: Inventory;
  readonly questLog: QuestLog;
  readonly skills: SkillManager;

  constructor(opts: PlayerOptions) {
    this.tileX = opts.tileX;
    this.tileY = opts.tileY;
    this.color = opts.color ?? "#e07a5f";
    this.hp = { current: opts.hp ?? 30, max: opts.maxHp ?? 30 };
    this.mana = { current: opts.mana ?? 20, max: opts.maxMana ?? 20 };
    this.attackLevel = opts.attackLevel ?? 10;
    this.strengthLevel = opts.strengthLevel ?? 10;
    this.defenceLevel = opts.defenceLevel ?? 10;
    this.level = opts.level ?? 1;
    this.xp = opts.xp ?? 0;
    this.gold = opts.gold ?? 200; // Increased starting gold for armor purchases
    this.inventory = new Inventory();
    this.questLog = new QuestLog();
    this.skills = new SkillManager();
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

  takeDamage(amount: number): void {
    this.hp.current = Math.max(0, this.hp.current - amount);
  }

  heal(amount: number): void {
    this.hp.current = Math.min(this.hp.max, this.hp.current + amount);
  }

  /**
   * Calculate total attack bonus from equipped items.
   */
  getTotalAttackBonus(): number {
    let bonus = 0;
    for (const slot of this.inventory.getAllEquipped()) {
      const stats = getEquipmentStats(slot.item.id);
      if (stats) {
        bonus += Math.max(
          stats.attackSlash ?? 0,
          stats.attackStab ?? 0,
          stats.attackCrush ?? 0
        );
      }
    }
    return bonus;
  }

  /**
   * Calculate total strength bonus from equipped items.
   */
  getTotalStrengthBonus(): number {
    let bonus = 0;
    for (const slot of this.inventory.getAllEquipped()) {
      const stats = getEquipmentStats(slot.item.id);
      if (stats?.strengthBonus) {
        bonus += stats.strengthBonus;
      }
    }
    return bonus;
  }

  /**
   * Calculate total defence bonus from equipped items.
   */
  getTotalDefenceBonus(): number {
    let bonus = 0;
    for (const slot of this.inventory.getAllEquipped()) {
      const stats = getEquipmentStats(slot.item.id);
      if (stats) {
        bonus += Math.max(
          stats.defenceSlash ?? 0,
          stats.defenceStab ?? 0,
          stats.defenceCrush ?? 0
        );
      }
    }
    return bonus;
  }

  /**
   * Roll melee damage against an enemy using OSRS combat formulas.
   */
  rollMeleeDamage(enemyDefenceLevel: number, enemyDefenceBonus: number): number {
    return rollMeleeDamage(
      this.attackLevel,
      this.strengthLevel,
      this.getTotalAttackBonus(),
      this.getTotalStrengthBonus(),
      enemyDefenceLevel,
      enemyDefenceBonus
    );
  }

  get isDead(): boolean {
    return this.hp.current === 0;
  }

  respawn(tileX: number, tileY: number): void {
    this.tileX = tileX;
    this.tileY = tileY;
    this.hp.current = this.hp.max;
    this.mana.current = this.mana.max;
  }

  gainXp(amount: number): void {
    this.xp += amount;
    while (this.xp >= this.xpForNextLevel()) {
      this.xp -= this.xpForNextLevel();
      this.levelUp();
    }
  }

  private xpForNextLevel(): number {
    return Math.floor(10 + this.level * 5);
  }

  private levelUp(): void {
    this.level++;
    this.hp.max += 5;
    this.hp.current = this.hp.max;
    this.mana.max += 3;
    this.mana.current = this.mana.max;
    this.attackLevel += 1;
    this.strengthLevel += 1;
    this.defenceLevel += 1;
    this.skills.checkLevelUnlocks(this.level);
  }

  xpProgress(): number {
    const needed = this.xpForNextLevel();
    return needed > 0 ? this.xp / needed : 0;
  }

  /**
   * Get equipped gear summary for stats panel display.
   */
  getEquippedGear(): EquippedGear {
    const gear: EquippedGear = {};
    const weapon = this.inventory.getEquipped("weapon");
    const body = this.inventory.getEquipped("body");
    const legs = this.inventory.getEquipped("legs");
    const head = this.inventory.getEquipped("head");

    if (weapon) gear.weapon = weapon.item.name;
    if (body) gear.body = body.item.name;
    if (legs) gear.legs = legs.item.name;
    if (head) gear.head = head.item.name;

    return gear;
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
