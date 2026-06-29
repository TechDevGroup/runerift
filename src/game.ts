import { TileMap, type TileMapData } from "./tilemap.ts";
import { Input } from "./input.ts";
import { Player } from "./player.ts";
import { Npc } from "./npc.ts";
import { Item } from "./item.ts";
import { Enemy } from "./enemy.ts";
import { StatsPanel } from "./stats.ts";
import { SpellSystem, SPELLS } from "./spell.ts";
import { getEquipmentStats } from "./data/ItemDefinition.ts";
import { rollMeleeDamage } from "./combat.ts";

export interface GameOptions {
  width: number;
  height: number;
  map: TileMapData;
  npcs?: Npc[];
  items?: Item[];
  enemies?: Enemy[];
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
  readonly npcs: Npc[];
  readonly items: Item[];
  readonly enemies: Enemy[];
  readonly stats: StatsPanel;
  readonly spells: SpellSystem;

  // where the player respawns after being defeated
  private readonly spawnX: number;
  private readonly spawnY: number;

  // camera top-left in pixels, kept centered on the player and clamped to map
  private camX = 0;
  private camY = 0;

  // the NPC whose dialogue is currently open, or null when no box is shown
  private activeNpc: Npc | null = null;

  // inventory UI state
  private inventoryOpen = false;

  // quest log UI state
  private questLogOpen = false;

  // shop UI state
  private shopOpen = false;
  private activeShopNpc: Npc | null = null;

  // skills UI state
  private skillsOpen = false;
  private selectedSkillIndex = 0;

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
    this.input = new Input(window, canvas);
    this.npcs = opts.npcs ?? [];
    this.items = opts.items ?? [];
    this.enemies = opts.enemies ?? [];
    this.spells = new SpellSystem();

    // spawn on the first walkable tile near the map's interior
    this.spawnX = 2;
    this.spawnY = 1;
    this.player = new Player({ tileX: this.spawnX, tileY: this.spawnY });
    // stats panel reads the player's live hp/mana each frame
    this.stats = new StatsPanel(this.player);
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

  private update(dt: number): void {
    // while a dialogue box is open, E closes it and movement is suspended
    if (this.activeNpc) {
      if (this.input.wasPressed("e") || this.input.wasPressed("escape")) {
        this.activeNpc = null;
      }
      return;
    }

    // inventory toggle
    if (this.input.wasPressed("i")) {
      this.inventoryOpen = !this.inventoryOpen;
    }

    // quest log toggle
    if (this.input.wasPressed("q")) {
      this.questLogOpen = !this.questLogOpen;
    }

    // shop toggle (only if adjacent to a vendor NPC)
    if (this.input.wasPressed("s")) {
      const vendor = this.findVendorNpc();
      if (vendor) {
        this.shopOpen = !this.shopOpen;
        this.activeShopNpc = this.shopOpen ? vendor : null;
      }
    }

    // skills toggle
    if (this.input.wasPressed("k")) {
      this.skillsOpen = !this.skillsOpen;
      if (this.skillsOpen) {
        this.selectedSkillIndex = 0;
      }
    }

    // while inventory, quest log, shop, or skills is open, suspend movement
    if (this.inventoryOpen || this.questLogOpen || this.shopOpen || this.skillsOpen) {
      if (this.input.wasPressed("escape")) {
        this.inventoryOpen = false;
        this.questLogOpen = false;
        this.shopOpen = false;
        this.skillsOpen = false;
        this.activeShopNpc = null;
      }

      // shop purchases: number keys 1-9 buy items by index
      if (this.shopOpen && this.activeShopNpc?.shop) {
        for (let i = 1; i <= 9; i++) {
          if (this.input.wasPressed(String(i))) {
            this.handleShopPurchase(this.activeShopNpc.shop, i - 1);
            break;
          }
        }
      }

      // skill navigation and assignment in skills UI
      if (this.skillsOpen) {
        const skills = this.player.skills.getUnlockedSkills();

        // W/S navigation through unlocked skills
        if (this.input.wasPressed("w") || this.input.wasPressed("arrowup")) {
          this.selectedSkillIndex = Math.max(0, this.selectedSkillIndex - 1);
        }
        if (this.input.wasPressed("s") || this.input.wasPressed("arrowdown")) {
          this.selectedSkillIndex = Math.min(skills.length - 1, this.selectedSkillIndex + 1);
        }

        // Clamp to valid range
        this.selectedSkillIndex = Math.max(0, Math.min(this.selectedSkillIndex, skills.length - 1));

        // 1-4 assigns selected skill to hotbar slot
        for (let i = 1; i <= 4; i++) {
          if (this.input.wasPressed(String(i))) {
            if (skills.length > 0 && this.selectedSkillIndex < skills.length) {
              this.player.skills.setHotbarSlot(i - 1, skills[this.selectedSkillIndex].id);
            }
          }
        }
      }

      return;
    }

    // hotbar skill usage outside of UI: 1-4
    for (let i = 1; i <= 4; i++) {
      if (this.input.wasPressed(String(i))) {
        const skill = this.player.skills.getHotbarSkill(i - 1);
        if (skill) {
          this.player.skills.useSkill(skill.id, this.player);
        }
        break;
      }
    }

    this.player.handleInput(this.input, this.tileMap);
    this.collectItems();

    if (this.input.wasPressed("e")) {
      this.activeNpc = this.findInteractableNpc();
    }

    if (this.input.wasPressed(" ")) {
      this.attackEnemies();
    }

    const click = this.input.getMouseClick();
    if (click && this.input.wasPressed("1")) {
      this.castSpell("fireball", click.x, click.y);
    }

    for (const enemy of this.enemies) {
      enemy.update(dt, this.player.tileX, this.player.tileY, (x, y) => this.tileMap.isSolid(x, y));
    }

    this.player.skills.update(dt);

    this.spells.update(dt, this.enemies, (enemy, damage) => {
      const fatal = enemy.takeDamage(damage);
      if (fatal) {
        this.player.gainXp(enemy.xp);
        const idx = this.enemies.indexOf(enemy);
        if (idx >= 0) this.enemies.splice(idx, 1);
      }
    });

    if (this.player.isDead) {
      this.player.respawn(this.spawnX, this.spawnY);
    }

    this.updateCamera();
  }

  /** Pick up any item the player is now standing on, adding it to inventory. */
  private collectItems(): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item.tileX === this.player.tileX && item.tileY === this.player.tileY) {
        if (item.pickUp(this.player.inventory)) {
          this.items.splice(i, 1);
        }
      }
    }
  }

  /** The first NPC adjacent to the player, or null. */
  private findInteractableNpc(): Npc | null {
    for (const npc of this.npcs) {
      if (npc.isAdjacentTo(this.player.tileX, this.player.tileY)) {
        this.handleNpcQuest(npc);
        return npc;
      }
    }
    return null;
  }

  /** The first vendor NPC adjacent to the player, or null. */
  private findVendorNpc(): Npc | null {
    for (const npc of this.npcs) {
      if (npc.shop && npc.isAdjacentTo(this.player.tileX, this.player.tileY)) {
        return npc;
      }
    }
    return null;
  }

  /** Purchase an item from the shop by index. */
  private handleShopPurchase(shop: any, index: number): void {
    const items = shop.getItems();
    if (index >= items.length) return;

    const shopEntry = items[index];
    if (!shop.canBuy(shopEntry.item.id, this.player.gold)) return;

    const purchased = shop.buy(shopEntry.item.id);
    if (!purchased) return;

    this.player.gold -= shopEntry.price;
    this.player.inventory.add(purchased);
  }

  private handleNpcQuest(npc: Npc): void {
    if (!npc.quest) return;

    const quest = npc.quest;
    const existing = this.player.questLog.get(quest.id);

    if (!existing) {
      this.player.questLog.add(quest);
    } else if (existing.status === "available") {
      this.player.questLog.accept(quest.id);
    } else if (this.player.questLog.canTurnIn(quest.id)) {
      if (quest.rewards.xp) {
        this.player.gainXp(quest.rewards.xp);
      }
      if (quest.rewards.items) {
        for (const rewardItem of quest.rewards.items) {
          // TODO: Quest rewards need to use real ItemDefinition IDs
          // For now, skipping inventory add until quest system is updated
          console.log(`Quest reward: ${rewardItem.name} x${rewardItem.quantity ?? 1}`);
        }
      }
    }
  }

  /** Attack all adjacent enemies using OSRS combat formulas; each attacked enemy retaliates. */
  private attackEnemies(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.isAdjacentTo(this.player.tileX, this.player.tileY)) {
        // Player attacks enemy with OSRS combat formula
        const damage = this.player.rollMeleeDamage(enemy.defence, 0);
        const fatal = enemy.takeDamage(damage);
        
        if (fatal) {
          this.player.gainXp(enemy.xp);
          for (const quest of this.player.questLog.getActive()) {
            this.player.questLog.incrementKillObjective(quest.id, enemy.name);
          }
          
          // Spawn loot drops
          const loot = enemy.rollDrops();
          for (const drop of loot) {
            this.items.push(
              new Item({
                tileX: enemy.tileX,
                tileY: enemy.tileY,
                itemId: drop.itemId,
                quantity: drop.quantity,
              })
            );
          }
          
          this.enemies.splice(i, 1);
        } else {
          // Enemy retaliates with OSRS combat formula
          const enemyDamage = rollMeleeDamage(
            enemy.attack,
            enemy.strength,
            0, // enemies don't have equipment bonuses
            0,
            this.player.defenceLevel,
            this.player.getTotalDefenceBonus()
          );
          this.player.takeDamage(enemyDamage);
        }
      }
    }
  }

  /** Cast a spell at the clicked screen position. */
  private castSpell(spellKey: string, screenX: number, screenY: number): void {
    const spell = SPELLS[spellKey];
    if (!spell) return;

    const worldX = screenX + this.camX;
    const worldY = screenY + this.camY;
    const tileX = Math.floor(worldX / this.tileMap.tileSize);
    const tileY = Math.floor(worldY / this.tileMap.tileSize);

    this.spells.cast(spell, this.player, tileX, tileY);
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
    for (const item of this.items) item.render(ctx, this.tileMap.tileSize, ox, oy);
    for (const npc of this.npcs) npc.render(ctx, this.tileMap.tileSize, ox, oy);
    for (const enemy of this.enemies) enemy.render(ctx, this.tileMap.tileSize, ox, oy);
    this.spells.render(ctx, this.tileMap.tileSize, ox, oy);
    this.player.render(ctx, this.tileMap.tileSize, ox, oy);

    if (this.activeNpc) this.renderDialogue(this.activeNpc);
    if (this.inventoryOpen) this.renderInventory();
    if (this.questLogOpen) this.renderQuestLog();
    if (this.shopOpen && this.activeShopNpc) this.renderShop(this.activeShopNpc);
    if (this.skillsOpen) this.renderSkills();

    // overlay HUD drawn last so it stays on top in fixed screen space
    this.stats.render(ctx);
    this.renderHotbar();
  }

  /** Draw a dialogue box across the bottom of the canvas, over everything. */
  private renderDialogue(npc: Npc): void {
    const { ctx, width, height } = this;
    const margin = 16;
    const boxH = 96;
    const boxX = margin;
    const boxY = height - boxH - margin;
    const boxW = width - margin * 2;

    ctx.fillStyle = "rgba(20, 24, 30, 0.92)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#8fbcbb";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#f2cc8f";
    ctx.font = "bold 16px monospace";
    ctx.fillText(npc.name, boxX + 14, boxY + 12);

    ctx.fillStyle = "#e8e8e8";
    ctx.font = "14px monospace";
    this.wrapText(npc.dialogue, boxX + 14, boxY + 38, boxW - 28, 18);

    ctx.fillStyle = "#9aa0a6";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText("[E] close", boxX + boxW - 14, boxY + boxH - 20);
  }

  /** Naive word-wrap for the dialogue body. */
  private wrapText(text: string, x: number, y: number, maxW: number, lineH: number): void {
    const { ctx } = this;
    const words = text.split(/\s+/);
    let line = "";
    let cy = y;
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, cy);
        line = word;
        cy += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, cy);
  }

  private renderInventory(): void {
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
    ctx.fillText("Inventory", boxX + 16, boxY + 16);

    const items = this.player.inventory.getAll();
    const equipped = this.player.inventory.getAllEquipped();

    let y = boxY + 50;
    ctx.font = "14px monospace";
    ctx.fillStyle = "#e8e8e8";

    if (items.length === 0 && equipped.length === 0) {
      ctx.fillText("Empty", boxX + 16, y);
    } else {
      if (equipped.length > 0) {
        ctx.fillStyle = "#f2cc8f";
        ctx.fillText("Equipped:", boxX + 16, y);
        y += 20;
        ctx.fillStyle = "#e8e8e8";
        for (const slot of equipped) {
          const stats = getEquipmentStats(slot.item.id);
          let statText = "";
          if (stats) {
            const bonuses = [];
            if (stats.attackSlash) bonuses.push(`+${stats.attackSlash} slash`);
            if (stats.attackStab) bonuses.push(`+${stats.attackStab} stab`);
            if (stats.attackCrush) bonuses.push(`+${stats.attackCrush} crush`);
            if (stats.strengthBonus) bonuses.push(`+${stats.strengthBonus} str`);
            if (stats.defenceSlash || stats.defenceStab || stats.defenceCrush) {
              const def = (stats.defenceSlash ?? 0) + (stats.defenceStab ?? 0) + (stats.defenceCrush ?? 0);
              bonuses.push(`+${def} def`);
            }
            if (bonuses.length > 0) statText = ` [${bonuses.join(", ")}]`;
          }
          ctx.fillText(`  ${slot.item.name}${statText}`, boxX + 16, y);
          y += 18;
        }
        y += 10;
      }

      if (items.length > 0) {
        ctx.fillStyle = "#f2cc8f";
        ctx.fillText("Items:", boxX + 16, y);
        y += 20;
        ctx.fillStyle = "#e8e8e8";
        for (const slot of items) {
          const qty = slot.item.stackable && slot.quantity ? ` x${slot.quantity}` : "";
          ctx.fillText(`  ${slot.item.name}${qty}`, boxX + 16, y);
          y += 18;
        }
      }
    }

    ctx.fillStyle = "#9aa0a6";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText("[I] close", boxX + boxW - 16, boxY + boxH - 20);
  }

  private renderQuestLog(): void {
    const { ctx, width, height } = this;
    const margin = 40;
    const boxW = width - margin * 2;
    const boxH = height - margin * 2;
    const boxX = margin;
    const boxY = margin;

    ctx.fillStyle = "rgba(20, 24, 30, 0.95)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#8fbcbb";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#8fbcbb";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Quest Log", boxX + 16, boxY + 16);

    const active = this.player.questLog.getActive();
    const completed = this.player.questLog.getCompleted();
    const available = this.player.questLog.getAvailable();

    let y = boxY + 50;
    ctx.font = "14px monospace";

    if (active.length === 0 && completed.length === 0 && available.length === 0) {
      ctx.fillStyle = "#e8e8e8";
      ctx.fillText("No quests", boxX + 16, y);
    } else {
      if (active.length > 0) {
        ctx.fillStyle = "#f2cc8f";
        ctx.fillText("Active Quests:", boxX + 16, y);
        y += 20;
        ctx.fillStyle = "#e8e8e8";
        for (const quest of active) {
          ctx.fillText(`  ${quest.title}`, boxX + 16, y);
          y += 18;
          for (const obj of quest.objectives) {
            const progress = `${obj.currentCount}/${obj.targetCount ?? 1}`;
            ctx.fillText(`    - ${obj.description} [${progress}]`, boxX + 20, y);
            y += 16;
          }
          y += 6;
        }
        y += 10;
      }

      if (completed.length > 0) {
        ctx.fillStyle = "#a3be8c";
        ctx.fillText("Completed:", boxX + 16, y);
        y += 20;
        ctx.fillStyle = "#e8e8e8";
        for (const quest of completed) {
          ctx.fillText(`  ✓ ${quest.title}`, boxX + 16, y);
          y += 18;
        }
        y += 10;
      }

      if (available.length > 0) {
        ctx.fillStyle = "#9aa0a6";
        ctx.fillText("Available:", boxX + 16, y);
        y += 20;
        ctx.fillStyle = "#e8e8e8";
        for (const quest of available) {
          ctx.fillText(`  ${quest.title} (talk to ${quest.giver})`, boxX + 16, y);
          y += 18;
        }
      }
    }

    ctx.fillStyle = "#9aa0a6";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText("[Q] close", boxX + boxW - 16, boxY + boxH - 20);
  }

  private renderShop(npc: Npc): void {
    if (!npc.shop) return;

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
    ctx.fillText(`${npc.shop.name} - Gold: ${this.player.gold}`, boxX + 16, boxY + 16);

    const shopItems = npc.shop.getItems();

    let y = boxY + 50;
    ctx.font = "14px monospace";
    ctx.fillStyle = "#e8e8e8";

    if (shopItems.length === 0) {
      ctx.fillText("No items for sale", boxX + 16, y);
    } else {
      ctx.fillStyle = "#f2cc8f";
      ctx.fillText("Items for sale (press number to buy):", boxX + 16, y);
      y += 20;
      ctx.fillStyle = "#e8e8e8";

      for (let i = 0; i < shopItems.length; i++) {
        const shopEntry = shopItems[i];
        const canAfford = this.player.gold >= shopEntry.price;
        ctx.fillStyle = canAfford ? "#e8e8e8" : "#6b6b6b";

        const stock = shopEntry.stock !== undefined ? ` (${shopEntry.stock} left)` : "";
        const index = i + 1;
        ctx.fillText(`  [${index}] ${shopEntry.item.name} - ${shopEntry.price}g${stock}`, boxX + 16, y);

        if (shopEntry.item.examine) {
          ctx.fillStyle = "#9aa0a6";
          ctx.font = "12px monospace";
          ctx.fillText(`      ${shopEntry.item.examine}`, boxX + 20, y + 16);
          ctx.font = "14px monospace";
          y += 16;
        }
        y += 20;

        if (i >= 8) break;
      }
    }

    ctx.fillStyle = "#9aa0a6";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText("[S] close", boxX + boxW - 16, boxY + boxH - 20);
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
    ctx.fillText("Skills (W/S navigate, 1-4 assign to hotbar)", boxX + 16, boxY + 16);

    const allSkills = this.player.skills.getAllSkills();
    let y = boxY + 50;
    ctx.font = "14px monospace";

    let unlockedIndex = 0;
    for (const skill of allSkills) {
      if (skill.unlocked) {
        const isSelected = unlockedIndex === this.selectedSkillIndex;

        // Highlight selected skill
        if (isSelected) {
          ctx.fillStyle = "rgba(242, 204, 143, 0.2)";
          ctx.fillRect(boxX + 10, y - 2, boxW - 20, 48);
        }

        ctx.fillStyle = isSelected ? "#f2cc8f" : "#e8e8e8";
        const cd = this.player.skills.getCooldownRemaining(skill.id);
        const cdText = cd > 0 ? ` (${cd.toFixed(1)}s)` : "";
        const prefix = isSelected ? "> " : "  ";
        ctx.fillText(`${prefix}${skill.name}${cdText}`, boxX + 16, y);
        y += 18;
        ctx.fillStyle = "#9aa0a6";
        ctx.font = "12px monospace";
        ctx.fillText(`    ${skill.description}`, boxX + 20, y);
        ctx.fillText(`    Cost: ${skill.manaCost} MP | CD: ${skill.cooldown}s`, boxX + 20, y + 14);
        ctx.font = "14px monospace";
        y += 32;
        unlockedIndex++;
      } else {
        ctx.fillStyle = "#666";
        ctx.fillText(`  ${skill.name} (Req. Lvl ${skill.requiredLevel})`, boxX + 16, y);
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
}
