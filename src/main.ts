import { Game } from "./game.ts";
import { Npc } from "./npc.ts";
import { Item } from "./item.ts";
import { Enemy } from "./enemy.ts";
import type { Quest } from "./quest.ts";
import { Shop, type ShopItem } from "./shop.ts";
import mapData from "./map.json";
import type { TileMapData } from "./tilemap.ts";
import { getNpc, NpcIds } from "./data/NpcDefinition.ts";
import { ItemIds } from "./data/ItemDefinition.ts";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("#game canvas not found");

const map = mapData as TileMapData;

// test quest: kill 3 goblins for Elder Maren
const goblinQuestData: Quest = {
  id: "goblin_threat",
  title: "Goblin Threat",
  description: "Elder Maren needs help clearing goblins from the area.",
  giver: "Elder Maren",
  objectives: [
    {
      description: "Defeat 3 Goblins",
      type: "kill",
      targetId: "Goblin",
      targetCount: 3,
      currentCount: 0,
    },
  ],
  rewards: {
    xp: 50,
    items: [{ id: "gold_coin", name: "Gold Coin", type: "consumable", quantity: 10 }],
  },
  status: "available",
};

// Shop inventory using real OSRS items from cache
const shopItems: ShopItem[] = [
  {
    itemId: ItemIds.BRONZE_SWORD, // 1277
    price: 26, // Real cache cost
    stock: 5,
  },
  {
    itemId: ItemIds.IRON_SWORD, // 1279
    price: 91, // Real cache cost
    stock: 3,
  },
  {
    itemId: ItemIds.STEEL_SWORD, // 1281
    price: 325, // Real cache cost
    stock: 2,
  },
];

const sandyShop = new Shop("Sandy's Wares", shopItems);

// NPCs using real OSRS cache data
const npcs = [
  // Quest giver (using Tool Leprechaun as placeholder, real quest NPCs need wider cache)
  new Npc({
    tileX: 5,
    tileY: 4,
    npcId: NpcIds.TOOL_LEPRECHAUN, // ID 0
    name: "Elder Maren", // Override cache name for quest context
    dialogue:
      "Welcome to runerift, traveler. The path ahead is yours to walk — press WASD to move, E to speak.",
    color: "#f2cc8f",
    quest: goblinQuestData,
  }),
  // Shop keeper (using Rug Merchant as general store)
  new Npc({
    tileX: 12,
    tileY: 10,
    npcId: NpcIds.RUG_MERCHANT, // ID 17
    name: "Sandy the Merchant", // Override cache name
    dialogue:
      "Fine wares from across the rift! Press S to browse my shop.",
    color: "#e9c46a",
    shop: sandyShop,
  }),
];

// Real OSRS item pickups scattered on walkable tiles
const items = [
  new Item({ tileX: 4, tileY: 2, itemId: ItemIds.SHRIMP }), // Food
  new Item({ tileX: 8, tileY: 6, itemId: ItemIds.COINS, quantity: 10 }), // Gold
  new Item({ tileX: 11, tileY: 3, itemId: ItemIds.TROUT }), // Food
];

// Real OSRS enemies from cache data
const goblinDef = getNpc(NpcIds.GOBLIN_1)!;
const hobgoblinDef = getNpc(NpcIds.HOBGOBLIN)!;

const enemies = [
  // Real goblins: combat level 5, hp 12, attack 3, strength 1, defence 4
  new Enemy({
    tileX: 7,
    tileY: 3,
    npcId: NpcIds.GOBLIN_1,
    name: goblinDef.name,
    hp: goblinDef.stats[5], // hitpoints
    attack: goblinDef.stats[0], // attack
    strength: goblinDef.stats[1], // strength
    defence: goblinDef.stats[2], // defence
    xp: goblinDef.stats[5] * 4, // OSRS: hitpoints * 4 for melee XP
  }),
  new Enemy({
    tileX: 9,
    tileY: 5,
    npcId: NpcIds.GOBLIN_2,
    name: goblinDef.name,
    hp: goblinDef.stats[5],
    attack: goblinDef.stats[0],
    strength: goblinDef.stats[1],
    defence: goblinDef.stats[2],
    xp: goblinDef.stats[5] * 4,
  }),
  new Enemy({
    tileX: 6,
    tileY: 8,
    npcId: NpcIds.GOBLIN_1,
    name: goblinDef.name,
    hp: goblinDef.stats[5],
    attack: goblinDef.stats[0],
    strength: goblinDef.stats[1],
    defence: goblinDef.stats[2],
    xp: goblinDef.stats[5] * 4,
  }),
  // Real hobgoblin: combat level 54, hp 62, attack 45, strength 43, defence 43
  new Enemy({
    tileX: 10,
    tileY: 7,
    npcId: NpcIds.HOBGOBLIN,
    name: hobgoblinDef.name,
    hp: hobgoblinDef.stats[5],
    attack: hobgoblinDef.stats[0],
    strength: hobgoblinDef.stats[1],
    defence: hobgoblinDef.stats[2],
    xp: hobgoblinDef.stats[5] * 4,
    color: "#c1121f",
  }),
];

const game = new Game(canvas, {
  width: map.width * map.tileSize,
  height: map.height * map.tileSize,
  map,
  npcs,
  items,
  enemies,
});
game.start();
