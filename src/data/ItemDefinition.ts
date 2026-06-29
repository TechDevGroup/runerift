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
} as const;
