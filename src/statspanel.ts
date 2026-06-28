export interface Stat {
  current: number;
  max: number;
}

export interface StatsPanelOptions {
  hp?: Stat;
  mana?: Stat;
}

/**
 * Corner overlay showing HP and mana as filled bars. Drawn last, in screen
 * space, so it stays fixed regardless of camera position.
 */
export class StatsPanel {
  hp: Stat;
  mana: Stat;

  constructor(opts: StatsPanelOptions = {}) {
    this.hp = opts.hp ?? { current: 30, max: 30 };
    this.mana = opts.mana ?? { current: 20, max: 20 };
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = 12;
    const y = 12;
    const barW = 160;
    const barH = 16;
    const gap = 8;

    this.drawBar(ctx, x, y, barW, barH, this.hp, "#c1453b", "#3a1614", "HP");
    this.drawBar(ctx, x, y + barH + gap, barW, barH, this.mana, "#3b7dc1", "#15243a", "MP");
  }

  private drawBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    stat: Stat,
    fill: string,
    back: string,
    label: string,
  ): void {
    const ratio = stat.max > 0 ? Math.max(0, Math.min(1, stat.current / stat.max)) : 0;

    // background track
    ctx.fillStyle = back;
    ctx.fillRect(x, y, w, h);

    // filled portion
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w * ratio, h);

    // border
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // label + value text
    ctx.fillStyle = "#f5f5f5";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${label}  ${stat.current}/${stat.max}`, x + 6, y + h / 2 + 0.5);
  }
}
