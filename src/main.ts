import { Game } from "./game.ts";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("#game canvas not found");

const game = new Game(canvas, { width: 512, height: 512 });
game.start();
