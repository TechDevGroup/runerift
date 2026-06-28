import { Game } from "./game.ts";
import { Npc } from "./npc.ts";
import mapData from "./map.json";
import type { TileMapData } from "./tilemap.ts";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("#game canvas not found");

const map = mapData as TileMapData;

// two test NPCs standing on walkable tiles
const npcs = [
  new Npc({
    tileX: 5,
    tileY: 4,
    name: "Elder Maren",
    dialogue:
      "Welcome to runerift, traveler. The path ahead is yours to walk — press WASD to move, E to speak.",
    color: "#f2cc8f",
  }),
  new Npc({
    tileX: 12,
    tileY: 10,
    name: "Sandy the Merchant",
    dialogue:
      "Fine wares from across the rift! Come back when I've got my stall sorted out.",
    color: "#e9c46a",
  }),
];

const game = new Game(canvas, {
  width: map.width * map.tileSize,
  height: map.height * map.tileSize,
  map,
  npcs,
});
game.start();
