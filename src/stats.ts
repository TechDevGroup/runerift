export interface BarStat {
  current: number;
  max: number;
}

export interface StatsSource {
  hp: BarStat;
  mana: BarStat;
  level?: number;
  xpProgress?: () => number;
}

/**
 * Corner overlay drawing HP and mana bars in screen space (not camera-offset).
 * Reads live values from a StatsSource each frame, so bars track the player.
 */
export class StatsPanel {
  private readonly source: StatsSource;
  private readonly margin: number;
  private readonly barW: number;
  private readonly barH: number;
  private readonly gap: number;

  constructor(source: StatsSource, opts: { margin?: number; barW?: number; barH?: number; gap?: number } = {}) {
    this.source = source;
    this.margin = opts.margin ?? 12;
    this.barW = opts.barW ?? 140;
    this.barH = opts.barH ?? 14;
    this.gap = opts.gap ?? 6;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.margin;
    let y = this.margin;

    if (this.source.level !== undefined) {
      ctx.fillStyle = "#f2cc8f";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`Level ${this.source.level}`, x, y);
      y += 16;
    }

    this.drawBar(ctx, x, y, this.source.hp, "HP", "#e63946", "#5a1f25");
    y += this.barH + this.gap;
    this.drawBar(ctx, x, y, this.source.mana, "MP", "#457bd8", "#1f2c5a");

    if (this.source.xpProgress) {
      y += this.barH + this.gap;
      this.drawXpBar(ctx, x, y, this.source.xpProgress());
    }
  }

  private drawBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    stat: BarStat,
    label: string,
    fill: string,
    track: string,
  ): void {
    const ratio = stat.max > 0 ? Math.max(0, Math.min(1, stat.current / stat.max)) : 0;

    // track
    ctx.fillStyle = track;
    ctx.fillRect(x, y, this.barW, this.barH);

    // fill
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, Math.round(this.barW * ratio), this.barH);

    // border
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, this.barW - 1, this.barH - 1);

    // label + numbers
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(label, x + 4, y + this.barH / 2 + 0.5);
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(stat.current)}/${stat.max}`, x + this.barW - 4, y + this.barH / 2 + 0.5);
  }

  private drawXpBar(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number): void {
    const ratio = Math.max(0, Math.min(1, progress));

    ctx.fillStyle = "#2a3540";
    ctx.fillRect(x, y, this.barW, this.barH);

    ctx.fillStyle = "#f2cc8f";
    ctx.fillRect(x, y, Math.round(this.barW * ratio), this.barH);

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, this.barW - 1, this.barH - 1);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("XP", x + 4, y + this.barH / 2 + 0.5);
  }
}
