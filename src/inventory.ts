export type ItemType = "weapon" | "armor" | "consumable" | "quest";

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  attackBonus?: number;
  defenseBonus?: number;
  hpRestore?: number;
  manaRestore?: number;
  stackable?: boolean;
  quantity?: number;
}

export class Inventory {
  private items: Map<string, InventoryItem> = new Map();
  private equipped: Map<string, InventoryItem> = new Map();
  private maxSlots = 20;

  add(item: InventoryItem): boolean {
    const existing = this.items.get(item.id);
    if (existing && item.stackable) {
      existing.quantity = (existing.quantity ?? 1) + (item.quantity ?? 1);
      return true;
    }

    if (this.items.size >= this.maxSlots && !existing) {
      return false;
    }

    this.items.set(item.id, { ...item, quantity: item.quantity ?? 1 });
    return true;
  }

  remove(itemId: string, amount = 1): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;

    if (item.stackable && item.quantity) {
      item.quantity -= amount;
      if (item.quantity <= 0) {
        this.items.delete(itemId);
      }
      return true;
    }

    this.items.delete(itemId);
    return true;
  }

  has(itemId: string): boolean {
    return this.items.has(itemId);
  }

  get(itemId: string): InventoryItem | undefined {
    return this.items.get(itemId);
  }

  getAll(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  equip(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item || (item.type !== "weapon" && item.type !== "armor")) {
      return false;
    }

    const slot = item.type;
    const currentEquipped = this.equipped.get(slot);
    if (currentEquipped) {
      this.items.set(currentEquipped.id, currentEquipped);
    }

    this.equipped.set(slot, item);
    this.items.delete(itemId);
    return true;
  }

  unequip(slot: string): boolean {
    const item = this.equipped.get(slot);
    if (!item) return false;

    if (this.items.size >= this.maxSlots) {
      return false;
    }

    this.items.set(item.id, item);
    this.equipped.delete(slot);
    return true;
  }

  getEquipped(slot: string): InventoryItem | undefined {
    return this.equipped.get(slot);
  }

  getAllEquipped(): InventoryItem[] {
    return Array.from(this.equipped.values());
  }

  getTotalAttackBonus(): number {
    let bonus = 0;
    for (const item of this.equipped.values()) {
      bonus += item.attackBonus ?? 0;
    }
    return bonus;
  }

  getTotalDefenseBonus(): number {
    let bonus = 0;
    for (const item of this.equipped.values()) {
      bonus += item.defenseBonus ?? 0;
    }
    return bonus;
  }
}
