import { Game } from "./game.ts";
import { Npc } from "./npc.ts";
import { Item } from "./item.ts";
import { Enemy } from "./enemy.ts";
import type { Quest } from "./quest.ts";
import { Shop, type ShopItem } from "./shop.ts";
import mapData from "./map.json";
import type { TileMapData } from "./tilemap.ts";

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

// test shop inventory
const shopItems: ShopItem[] = [
  {
    id: "iron_sword",
    name: "Iron Sword",
    type: "weapon",
    description: "A sturdy iron blade",
    attackBonus: 3,
    price: 100,
    stock: 2,
  },
  {
    id: "leather_armor",
    name: "Leather Armor",
    type: "armor",
    description: "Light protection",
    defenseBonus: 2,
    price: 80,
    stock: 3,
  },
  {
    id: "hp_potion",
    name: "Health Potion",
    type: "consumable",
    description: "Restores 20 HP",
    hpRestore: 20,
    price: 15,
    stackable: true,
  },
];

const sandyShop = new Shop("Sandy's Wares", shopItems);

// two test NPCs standing on walkable tiles
const npcs = [
  new Npc({
    tileX: 5,
    tileY: 4,
    name: "Elder Maren",
    dialogue:
      "Welcome to runerift, traveler. The path ahead is yours to walk — press WASD to move, E to speak.",
    color: "#f2cc8f",
    quest: goblinQuestData,
  }),
  new Npc({
    tileX: 12,
    tileY: 10,
    name: "Sandy the Merchant",
    dialogue:
      "Fine wares from across the rift! Press S to browse my shop.",
    color: "#e9c46a",
    shop: sandyShop,
  }),
];

// pickups scattered on walkable tiles — step onto one to restore a vital
const items = [
  new Item({ tileX: 4, tileY: 2, kind: "hp", amount: 10 }),
  new Item({ tileX: 8, tileY: 6, kind: "mana", amount: 8 }),
  new Item({ tileX: 11, tileY: 3, kind: "hp", amount: 10 }),
];

// test enemies with varied stats and XP rewards
const enemies = [
  new Enemy({ tileX: 7, tileY: 3, name: "Goblin", hp: 12, attack: 4, xp: 8 }),
  new Enemy({ tileX: 9, tileY: 5, name: "Goblin", hp: 12, attack: 4, xp: 8 }),
  new Enemy({ tileX: 6, tileY: 8, name: "Goblin", hp: 12, attack: 4, xp: 8 }),
  new Enemy({ tileX: 10, tileY: 7, name: "Orc", hp: 20, attack: 6, xp: 15, color: "#c1121f" }),
  new Enemy({ tileX: 14, tileY: 5, name: "Dark Wizard", hp: 15, attack: 8, xp: 20, color: "#5a189a" }),
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
