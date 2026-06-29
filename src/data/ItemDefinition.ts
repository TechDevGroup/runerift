/**
 * Real OSRS item definition from cache.
 * Matches structure from RuneLite ItemDefinition and osrs-dumps.
 */
export interface ItemDefinition {
  id: number;
  name: string;
  cost: number;
  stackable: boolean;
  members: boolean;
  examine?: string;
  tradeable: boolean;
  equipable?: boolean;
  wearPos?: "weapon" | "body" | "legs" | "head" | "cape" | "hands" | "feet" | "neck" | "ring" | "ammo";
}

/**
 * OSRS equipment bonuses - real stats from OSRS wiki.
 * Maps item ID to attack/defence/strength bonuses.
 */
export interface EquipmentStats {
  attackStab?: number;
  attackSlash?: number;
  attackCrush?: number;
  defenceStab?: number;
  defenceSlash?: number;
  defenceCrush?: number;
  strengthBonus?: number;
  rangedStrength?: number;
  magicDamage?: number;
  prayer?: number;
}

/**
 * Real OSRS equipment stats for common items.
 * Source: OSRS Wiki equipment stats tables.
 */
const EQUIPMENT_STATS = new Map<number, EquipmentStats>([
  // Bronze weapons
  [1277, { attackSlash: 4, strengthBonus: 3 }], // Bronze sword
  // Iron weapons
  [1279, { attackSlash: 9, strengthBonus: 7 }], // Iron sword
  // Steel weapons
  [1281, { attackSlash: 14, strengthBonus: 11 }], // Steel sword
  // Bronze armor
  [1117, { defenceStab: 6, defenceSlash: 5, defenceCrush: 7 }], // Bronze platebody
  [1153, { defenceStab: 8, defenceSlash: 7, defenceCrush: 6 }], // Bronze platelegs
  // Iron armor
  [1119, { defenceStab: 13, defenceSlash: 12, defenceCrush: 15 }], // Iron platebody
  [1155, { defenceStab: 16, defenceSlash: 15, defenceCrush: 14 }], // Iron platelegs
  // Steel armor
  [1121, { defenceStab: 28, defenceSlash: 26, defenceCrush: 30 }], // Steel platebody
  [1157, { defenceStab: 32, defenceSlash: 30, defenceCrush: 28 }], // Steel platelegs
]);

/**
 * Get equipment stats for an item.
 */
export function getEquipmentStats(itemId: number): EquipmentStats | undefined {
  return EQUIPMENT_STATS.get(itemId);
}

/**
 * Real OSRS food healing values.
 * Source: OSRS Wiki food healing tables.
 */
const FOOD_HEAL_VALUES = new Map<number, number>([
  [315, 3],   // Shrimp
  [333, 7],   // Trout
  [329, 9],   // Salmon
  [379, 12],  // Lobster
  [385, 20],  // Shark
]);

/**
 * Get HP healing value for food item.
 */
export function getFoodHealValue(itemId: number): number | undefined {
  return FOOD_HEAL_VALUES.get(itemId);
}

/**
 * Check if item is consumable food.
 */
export function isFood(itemId: number): boolean {
  return FOOD_HEAL_VALUES.has(itemId);
}

/**
 * Load all items from parsed cache.
 */
import itemsData from "../../data/items.json";

export const ITEMS = new Map<number, ItemDefinition>(
  (itemsData as ItemDefinition[]).map((item) => [item.id, item])
);

/**
 * Get item definition by ID.
 */
export function getItem(id: number): ItemDefinition | undefined {
  return ITEMS.get(id);
}

/**
 * Find items by name (case-insensitive partial match).
 */
export function findItemsByName(name: string): ItemDefinition[] {
  const lower = name.toLowerCase();
  return Array.from(ITEMS.values()).filter((item) =>
    item.name.toLowerCase().includes(lower)
  );
}

// Common item IDs from real OSRS
export const ItemIds = {
  COINS: 995,
  BRONZE_SWORD: 1277,
  IRON_SWORD: 1279,
  STEEL_SWORD: 1281,
  BRONZE_PLATEBODY: 1117,
  IRON_PLATEBODY: 1119,
  STEEL_PLATEBODY: 1121,
  BRONZE_PLATELEGS: 1153,
  HAMMER: 2347,
  BRONZE_PICKAXE: 1265,
  BRONZE_AXE: 1351,
  SHRIMP: 315,
  TROUT: 333,
  SALMON: 329,
  LOBSTER: 379,
} as const;
