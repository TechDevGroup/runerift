import { Game } from "./game.ts";
import mapData from "./map.json";
import type { TileMapData } from "./tilemap.ts";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("#game canvas not found");

const map = mapData as TileMapData;
const game = new Game(canvas, {
  width: map.width * map.tileSize,
  height: map.height * map.tileSize,
  map,
});
game.start();
