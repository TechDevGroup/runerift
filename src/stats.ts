export interface BarStat {
  current: number;
  max: number;
}

export interface EquippedGear {
  weapon?: string;
  body?: string;
  legs?: string;
  head?: string;
}

export interface StatsSource {
  hp: BarStat;
  mana: BarStat;
  level?: number;
  xpProgress?: () => number;
  attackLevel?: number;
  strengthLevel?: number;
  defenceLevel?: number;
  getTotalAttackBonus?: () => number;
  getTotalStrengthBonus?: () => number;
  getTotalDefenceBonus?: () => number;
  getEquippedGear?: () => EquippedGear;
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

    // Combat stats header
    if (this.source.level !== undefined) {
      ctx.fillStyle = "#f2cc8f";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`Level ${this.source.level}`, x, y);
      y += 16;
    }

    // HP and Mana bars
    this.drawBar(ctx, x, y, this.source.hp, "HP", "#e63946", "#5a1f25");
    y += this.barH + this.gap;
    this.drawBar(ctx, x, y, this.source.mana, "MP", "#457bd8", "#1f2c5a");
    y += this.barH + this.gap;

    // XP bar
    if (this.source.xpProgress) {
      this.drawXpBar(ctx, x, y, this.source.xpProgress());
      y += this.barH + this.gap + 6;
    }

    // Combat stats (OSRS style)
    if (this.source.attackLevel !== undefined) {
      ctx.fillStyle = "#f2cc8f";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("Combat Stats", x, y);
      y += 14;

      ctx.fillStyle = "#e8e8e8";
      ctx.font = "10px monospace";
      
      const attackBonus = this.source.getTotalAttackBonus?.() ?? 0;
      const strengthBonus = this.source.getTotalStrengthBonus?.() ?? 0;
      const defenceBonus = this.source.getTotalDefenceBonus?.() ?? 0;

      const attackText = attackBonus > 0 ? ` (+${attackBonus})` : "";
      const strengthText = strengthBonus > 0 ? ` (+${strengthBonus})` : "";
      const defenceText = defenceBonus > 0 ? ` (+${defenceBonus})` : "";

      ctx.fillText(`Attack:    ${this.source.attackLevel}${attackText}`, x, y);
      y += 12;
      ctx.fillText(`Strength:  ${this.source.strengthLevel}${strengthText}`, x, y);
      y += 12;
      ctx.fillText(`Defence:   ${this.source.defenceLevel}${defenceText}`, x, y);
      y += 14;

      // Equipment loadout
      const gear = this.source.getEquippedGear?.();
      if (gear && (gear.weapon || gear.body || gear.legs || gear.head)) {
        ctx.fillStyle = "#f2cc8f";
        ctx.font = "bold 10px monospace";
        ctx.fillText("Equipment", x, y);
        y += 14;

        ctx.fillStyle = "#9aa0a6";
        ctx.font = "10px monospace";

        if (gear.weapon) {
          ctx.fillText(`Weapon: ${gear.weapon}`, x, y);
          y += 12;
        }
        if (gear.body) {
          ctx.fillText(`Body:   ${gear.body}`, x, y);
          y += 12;
        }
        if (gear.legs) {
          ctx.fillText(`Legs:   ${gear.legs}`, x, y);
          y += 12;
        }
        if (gear.head) {
          ctx.fillText(`Head:   ${gear.head}`, x, y);
          y += 12;
        }
      }
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
