// Patch for game.ts to add skills UI and hotbar
// Add after shopOpen/activeShopNpc state:
//   private skillsOpen = false;

// In update(), after shop toggle block, add:
//   if (this.input.wasPressed("k")) {
//     this.skillsOpen = !this.skillsOpen;
//   }

// Update the UI suspension check to include skillsOpen:
//   if (this.inventoryOpen || this.questLogOpen || this.shopOpen || this.skillsOpen) {
//     if (this.input.wasPressed("escape")) {
//       this.inventoryOpen = false;
//       this.questLogOpen = false;
//       this.shopOpen = false;
//       this.skillsOpen = false;
//       this.activeShopNpc = null;
//     }
//     // Keep shop purchases block
//     return;
//   }

// After the return block, add hotbar usage:
//   for (let i = 1; i <= 4; i++) {
//     if (this.input.wasPressed(i.toString())) {
//       this.useHotbarSkill(i - 1);
//     }
//   }

// In render(), add before stats.render():
//   if (this.skillsOpen) this.renderSkills();
// After stats.render(), add:
//   this.renderHotbar();

// Add these methods at the end:

  private useHotbarSkill(slot: number): void {
    const skill = this.player.skills.getHotbarSkill(slot);
    if (!skill) return;
    this.player.skills.useSkill(skill.id, this.player);
  }

  private renderSkills(): void {
    const { ctx, width, height } = this;
    const margin = 40;
    const boxW = width - margin * 2;
    const boxH = height - margin * 2;
    const boxX = margin;
    const boxY = margin;

    ctx.fillStyle = "rgba(20, 24, 30, 0.95)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#f2cc8f";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#f2cc8f";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Skills", boxX + 16, boxY + 16);

    const skills = this.player.skills.getAllSkills();
    let y = boxY + 50;
    ctx.font = "14px monospace";

    for (const skill of skills) {
      if (skill.unlocked) {
        ctx.fillStyle = "#e8e8e8";
        const cd = this.player.skills.getCooldownRemaining(skill.id);
        const cdText = cd > 0 ? ` (${cd.toFixed(1)}s)` : "";
        ctx.fillText(`${skill.name}${cdText}`, boxX + 16, y);
        y += 18;
        ctx.fillStyle = "#9aa0a6";
        ctx.font = "12px monospace";
        ctx.fillText(`  ${skill.description}`, boxX + 20, y);
        ctx.fillText(`  Cost: ${skill.manaCost} MP | CD: ${skill.cooldown}s`, boxX + 20, y + 14);
        ctx.font = "14px monospace";
        y += 32;
      } else {
        ctx.fillStyle = "#666";
        ctx.fillText(`${skill.name} (Req. Lvl ${skill.requiredLevel})`, boxX + 16, y);
        y += 18;
      }
    }

    ctx.fillStyle = "#9aa0a6";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText("[K] close", boxX + boxW - 16, boxY + boxH - 20);
  }

  private renderHotbar(): void {
    const { ctx, width, height } = this;
    const slotW = 50;
    const slotH = 50;
    const gap = 8;
    const totalW = slotW * 4 + gap * 3;
    const startX = (width - totalW) / 2;
    const y = height - slotH - 16;

    for (let i = 0; i < 4; i++) {
      const x = startX + i * (slotW + gap);
      const skill = this.player.skills.getHotbarSkill(i);

      ctx.fillStyle = "rgba(20, 24, 30, 0.8)";
      ctx.fillRect(x, y, slotW, slotH);
      ctx.strokeStyle = skill ? "#f2cc8f" : "#666";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, slotW, slotH);

      ctx.fillStyle = "#e8e8e8";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`${i + 1}`, x + slotW / 2, y + 4);

      if (skill) {
        ctx.font = "9px monospace";
        ctx.fillText(skill.name.substring(0, 8), x + slotW / 2, y + slotH / 2);

        const cd = this.player.skills.getCooldownRemaining(skill.id);
        if (cd > 0) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          const h = (cd / skill.cooldown) * slotH;
          ctx.fillRect(x, y + slotH - h, slotW, h);
        }
      }
    }
  }
