import type { Player } from "./player.ts";
import type { Enemy } from "./enemy.ts";

export type SkillTarget = "self" | "enemy" | "area";

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  manaCost: number;
  targetType: SkillTarget;
  damage?: number;
  heal?: number;
  range?: number;
  radius?: number;
  requiredLevel: number;
  unlocked: boolean;
}

export interface ActiveSkill {
  skill: SkillDefinition;
  remainingCooldown: number;
}

export class SkillManager {
  private skills: Map<string, SkillDefinition> = new Map();
  private activeSkills: Map<string, ActiveSkill> = new Map();
  private hotbar: (string | null)[] = [null, null, null, null];

  constructor() {
    this.initializeSkills();
  }

  private initializeSkills(): void {
    const baseSkills: SkillDefinition[] = [
      {
        id: "whirlwind",
        name: "Whirlwind",
        description: "Spin attack hitting all adjacent enemies",
        cooldown: 5,
        manaCost: 10,
        targetType: "area",
        damage: 12,
        range: 1,
        requiredLevel: 3,
        unlocked: false,
      },
      {
        id: "heal",
        name: "Heal",
        description: "Restore 20 HP",
        cooldown: 8,
        manaCost: 15,
        targetType: "self",
        heal: 20,
        requiredLevel: 2,
        unlocked: false,
      },
      {
        id: "power_strike",
        name: "Power Strike",
        description: "Deal double damage to a single enemy",
        cooldown: 6,
        manaCost: 8,
        targetType: "enemy",
        damage: 0,
        range: 1,
        requiredLevel: 1,
        unlocked: true,
      },
      {
        id: "teleport",
        name: "Teleport",
        description: "Instantly move to a nearby location",
        cooldown: 10,
        manaCost: 20,
        targetType: "area",
        range: 5,
        requiredLevel: 5,
        unlocked: false,
      },
    ];

    for (const skill of baseSkills) {
      this.skills.set(skill.id, skill);
    }
  }

  update(dt: number): void {
    for (const [id, active] of this.activeSkills) {
      active.remainingCooldown = Math.max(0, active.remainingCooldown - dt);
      if (active.remainingCooldown === 0) {
        this.activeSkills.delete(id);
      }
    }
  }

  unlockSkill(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;
    skill.unlocked = true;
    return true;
  }

  checkLevelUnlocks(level: number): string[] {
    const newlyUnlocked: string[] = [];
    for (const skill of this.skills.values()) {
      if (!skill.unlocked && level >= skill.requiredLevel) {
        skill.unlocked = true;
        newlyUnlocked.push(skill.name);
        this.autoAssignToHotbar(skill.id);
      }
    }
    return newlyUnlocked;
  }

  /** Auto-assign a skill to the first empty hotbar slot. */
  private autoAssignToHotbar(skillId: string): void {
    for (let i = 0; i < this.hotbar.length; i++) {
      if (this.hotbar[i] === null) {
        this.hotbar[i] = skillId;
        break;
      }
    }
  }

  canUseSkill(skillId: string, mana: number): boolean {
    const skill = this.skills.get(skillId);
    if (!skill || !skill.unlocked) return false;
    if (mana < skill.manaCost) return false;
    const active = this.activeSkills.get(skillId);
    if (active && active.remainingCooldown > 0) return false;
    return true;
  }

  useSkill(
    skillId: string,
    player: Player,
    _targetX?: number,
    _targetY?: number,
  ): { success: boolean; affectedEnemies?: Enemy[] } {
    const skill = this.skills.get(skillId);
    if (!skill || !this.canUseSkill(skillId, player.mana.current)) {
      return { success: false };
    }

    player.mana.current = Math.max(0, player.mana.current - skill.manaCost);

    this.activeSkills.set(skillId, {
      skill,
      remainingCooldown: skill.cooldown,
    });

    if (skill.targetType === "self" && skill.heal) {
      player.hp.current = Math.min(player.hp.max, player.hp.current + skill.heal);
    }

    return { success: true };
  }

  getSkill(skillId: string): SkillDefinition | undefined {
    return this.skills.get(skillId);
  }

  getUnlockedSkills(): SkillDefinition[] {
    return Array.from(this.skills.values()).filter((s) => s.unlocked);
  }

  getAllSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  getCooldownRemaining(skillId: string): number {
    const active = this.activeSkills.get(skillId);
    return active ? active.remainingCooldown : 0;
  }

  setHotbarSlot(slot: number, skillId: string | null): void {
    if (slot < 0 || slot >= this.hotbar.length) return;
    this.hotbar[slot] = skillId;
  }

  getHotbarSkill(slot: number): SkillDefinition | null {
    if (slot < 0 || slot >= this.hotbar.length) return null;
    const skillId = this.hotbar[slot];
    if (!skillId) return null;
    return this.skills.get(skillId) ?? null;
  }

  getHotbar(): (SkillDefinition | null)[] {
    return this.hotbar.map((id) => (id ? this.skills.get(id) ?? null : null));
  }
}
