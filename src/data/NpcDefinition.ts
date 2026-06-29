/**
 * Real OSRS NPC definition from cache.
 * Matches structure from RuneLite NpcDefinition and osrs-dumps.
 */
export interface NpcDefinition {
  id: number;
  name: string;
  size: number;
  combatLevel: number;
  /** [attack, strength, defence, magic, ranged, hitpoints] */
  stats: [number, number, number, number, number, number];
  examine?: string;
  attackable: boolean;
}

/**
 * Load all NPCs from parsed cache.
 */
import npcsData from "../../data/npcs.json";

export const NPCS = new Map<number, NpcDefinition>(
  (npcsData as NpcDefinition[]).map((npc) => [npc.id, npc])
);

/**
 * Get NPC definition by ID.
 */
export function getNpc(id: number): NpcDefinition | undefined {
  return NPCS.get(id);
}

/**
 * Find NPCs by name (case-insensitive partial match).
 */
export function findNpcsByName(name: string): NpcDefinition[] {
  const lower = name.toLowerCase();
  return Array.from(NPCS.values()).filter((npc) =>
    npc.name.toLowerCase().includes(lower)
  );
}

// Common NPC IDs from real OSRS
export const NpcIds = {
  GOBLIN_1: 655,
  GOBLIN_2: 656,
  HOBGOBLIN: 132,
} as const;
