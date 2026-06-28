import { TileMap, type TileMapData } from "./tilemap.ts";

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
    requestAnimationFrame(this.frame);
  };

  private update(_dt: number): void {
    // phases hook simulation here
  }

  private render(): void {
    const { ctx, width, height } = this;
    ctx.fillStyle = "#202830";
    ctx.fillRect(0, 0, width, height);
    this.tileMap.render(ctx);
  }
}
