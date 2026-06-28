export interface TileDef {
  name: string;
  color: string;
  solid: boolean;
}

export interface TileMapData {
  tileSize: number;
  width: number;
  height: number;
  tiles: Record<string, TileDef>;
  data: number[][];
}

/**
 * Renders a grid of tiles to the canvas as placeholder color blocks.
 * Sprite atlas support can swap in later without changing the interface.
 */
export class TileMap {
  readonly tileSize: number;
  readonly width: number;
  readonly height: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;

  private readonly tiles: Record<string, TileDef>;
  private readonly data: number[][];

  constructor(map: TileMapData) {
    this.tileSize = map.tileSize;
    this.width = map.width;
    this.height = map.height;
    this.tiles = map.tiles;
    this.data = map.data;
    this.pixelWidth = map.width * map.tileSize;
    this.pixelHeight = map.height * map.tileSize;
  }

  tileAt(tx: number, ty: number): TileDef | undefined {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return undefined;
    return this.tiles[String(this.data[ty][tx])];
  }

  isSolid(tx: number, ty: number): boolean {
    const tile = this.tileAt(tx, ty);
    // out of bounds counts as solid so nothing walks off the map
    return tile ? tile.solid : true;
  }

  render(ctx: CanvasRenderingContext2D, offsetX = 0, offsetY = 0): void {
    const ts = this.tileSize;
    for (let ty = 0; ty < this.height; ty++) {
      const row = this.data[ty];
      for (let tx = 0; tx < this.width; tx++) {
        const def = this.tiles[String(row[tx])];
        ctx.fillStyle = def ? def.color : "#ff00ff";
        ctx.fillRect(offsetX + tx * ts, offsetY + ty * ts, ts, ts);
      }
    }
  }
}
