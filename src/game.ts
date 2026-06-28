import { TileMap, type TileMapData } from "./tilemap.ts";
import { Input } from "./input.ts";
import { Player } from "./player.ts";

export interface GameOptions {
  width: number;
  height: number;
  map: TileMapData;
}

/**
 * Core game shell: owns the canvas, the 2D context, and the main loop.
 * Phases build on top of this — tile map, player, npcs, stats panel.
 */
export class Game {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;
  readonly tileMap: TileMap;
  readonly input: Input;
  readonly player: Player;

  // camera top-left in pixels, kept centered on the player and clamped to map
  private camX = 0;
  private camY = 0;

  private running = false;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement, opts: GameOptions) {
    this.canvas = canvas;
    this.width = opts.width;
    this.height = opts.height;
    canvas.width = opts.width;
    canvas.height = opts.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;

    this.tileMap = new TileMap(opts.map);
    this.input = new Input();

    // spawn on the first walkable tile near the map's interior
    this.player = new Player({ tileX: 2, tileY: 1 });
    this.updateCamera();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame(this.frame);
  };

  private update(_dt: number): void {
    this.player.handleInput(this.input, this.tileMap);
    this.updateCamera();
  }

  /** Center the camera on the player, clamped so it never shows past the map edge. */
  private updateCamera(): void {
    const ts = this.tileMap.tileSize;
    const targetX = this.player.tileX * ts + ts / 2 - this.width / 2;
    const targetY = this.player.tileY * ts + ts / 2 - this.height / 2;
    const maxX = Math.max(0, this.tileMap.pixelWidth - this.width);
    const maxY = Math.max(0, this.tileMap.pixelHeight - this.height);
    this.camX = Math.min(Math.max(0, targetX), maxX);
    this.camY = Math.min(Math.max(0, targetY), maxY);
  }

  private render(): void {
    const { ctx, width, height } = this;
    ctx.fillStyle = "#202830";
    ctx.fillRect(0, 0, width, height);

    const ox = -this.camX;
    const oy = -this.camY;
    this.tileMap.render(ctx, ox, oy);
    this.player.render(ctx, this.tileMap.tileSize, ox, oy);
  }
}
