/**
 * Real OSRS prayer system.
 * Source: OSRS Wiki prayer data.
 */

export interface Prayer {
  id: string;
  name: string;
  level: number;
  drainRate: number; // drain per minute in OSRS
  effectType: "defence" | "attack" | "strength" | "protect_melee" | "protect_ranged" | "protect_magic";
  effectValue: number; // percentage boost or 1.0 for protection
}

/**
 * Real OSRS prayers with accurate drain rates and effects.
 */
export const PRAYERS: Record<string, Prayer> = {
  THICK_SKIN: {
    id: "THICK_SKIN",
    name: "Thick Skin",
    level: 1,
    drainRate: 3, // OSRS: 3 points per minute
    effectType: "defence",
    effectValue: 0.05, // +5% defence
  },
  BURST_OF_STRENGTH: {
    id: "BURST_OF_STRENGTH",
    name: "Burst of Strength",
    level: 4,
    drainRate: 3,
    effectType: "strength",
    effectValue: 0.05, // +5% strength
  },
  CLARITY_OF_THOUGHT: {
    id: "CLARITY_OF_THOUGHT",
    name: "Clarity of Thought",
    level: 7,
    drainRate: 3,
    effectType: "attack",
    effectValue: 0.05, // +5% attack
  },
  PROTECT_FROM_MELEE: {
    id: "PROTECT_FROM_MELEE",
    name: "Protect from Melee",
    level: 43,
    drainRate: 12, // OSRS: 12 points per minute
    effectType: "protect_melee",
    effectValue: 1.0, // 100% protection
  },
};

export class PrayerManager {
  private activePrayers: Set<string> = new Set();
  private prayerLevel: number;
  private prayerPoints: { current: number; max: number };

  constructor(level: number, points: number) {
    this.prayerLevel = level;
    this.prayerPoints = { current: points, max: points };
  }

  /**
   * Activate a prayer if player has required level and prayer points.
   */
  activate(prayerId: string): boolean {
    const prayer = PRAYERS[prayerId];
    if (!prayer) return false;
    if (this.prayerLevel < prayer.level) return false;
    if (this.prayerPoints.current <= 0) return false;

    // Deactivate protection prayers if activating a new one (only one can be active)
    if (prayer.effectType.startsWith("protect_")) {
      for (const activeId of this.activePrayers) {
        const activePrayer = PRAYERS[activeId];
        if (activePrayer?.effectType.startsWith("protect_")) {
          this.activePrayers.delete(activeId);
        }
      }
    }

    this.activePrayers.add(prayerId);
    return true;
  }

  /**
   * Deactivate a prayer.
   */
  deactivate(prayerId: string): void {
    this.activePrayers.delete(prayerId);
  }

  /**
   * Toggle prayer on/off.
   */
  toggle(prayerId: string): boolean {
    if (this.activePrayers.has(prayerId)) {
      this.deactivate(prayerId);
      return false;
    } else {
      return this.activate(prayerId);
    }
  }

  /**
   * Drain prayer points based on active prayers.
   * Called once per game tick (simplified: drain = drainRate / 60 per second).
   */
  drain(deltaTime: number): void {
    if (this.activePrayers.size === 0) return;

    let totalDrain = 0;
    for (const prayerId of this.activePrayers) {
      const prayer = PRAYERS[prayerId];
      if (prayer) {
        // OSRS: drain per minute, convert to per second
        totalDrain += (prayer.drainRate / 60) * deltaTime;
      }
    }

    this.prayerPoints.current = Math.max(0, this.prayerPoints.current - totalDrain);

    // Deactivate all prayers if points depleted
    if (this.prayerPoints.current <= 0) {
      this.activePrayers.clear();
    }
  }

  /**
   * Check if a prayer is active.
   */
  isActive(prayerId: string): boolean {
    return this.activePrayers.has(prayerId);
  }

  /**
   * Get all active prayers.
   */
  getActive(): Prayer[] {
    const active: Prayer[] = [];
    for (const prayerId of this.activePrayers) {
      const prayer = PRAYERS[prayerId];
      if (prayer) active.push(prayer);
    }
    return active;
  }

  /**
   * Get available prayers based on level.
   */
  getAvailable(): Prayer[] {
    return Object.values(PRAYERS).filter(p => p.level <= this.prayerLevel);
  }

  /**
   * Restore prayer points.
   */
  restore(amount: number): void {
    this.prayerPoints.current = Math.min(this.prayerPoints.max, this.prayerPoints.current + amount);
  }

  get points() {
    return this.prayerPoints;
  }

  get level() {
    return this.prayerLevel;
  }

  /**
   * Calculate total defence bonus from active prayers.
   */
  getDefenceBonus(): number {
    let bonus = 0;
    for (const prayerId of this.activePrayers) {
      const prayer = PRAYERS[prayerId];
      if (prayer?.effectType === "defence") {
        bonus += prayer.effectValue;
      }
    }
    return bonus;
  }

  /**
   * Calculate total attack bonus from active prayers.
   */
  getAttackBonus(): number {
    let bonus = 0;
    for (const prayerId of this.activePrayers) {
      const prayer = PRAYERS[prayerId];
      if (prayer?.effectType === "attack") {
        bonus += prayer.effectValue;
      }
    }
    return bonus;
  }

  /**
   * Calculate total strength bonus from active prayers.
   */
  getStrengthBonus(): number {
    let bonus = 0;
    for (const prayerId of this.activePrayers) {
      const prayer = PRAYERS[prayerId];
      if (prayer?.effectType === "strength") {
        bonus += prayer.effectValue;
      }
    }
    return bonus;
  }

  /**
   * Check if protected from melee.
   */
  isProtectedFromMelee(): boolean {
    return this.isActive("PROTECT_FROM_MELEE");
  }
}
