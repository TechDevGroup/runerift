import type { ItemDefinition } from "./data/ItemDefinition.ts";
import { getEquipmentStats, getFoodHealValue, isFood } from "./data/ItemDefinition.ts";

/**
 * Inventory slot: real OSRS item + quantity.
 */
export interface InventorySlot {
  item: ItemDefinition;
  quantity: number;
}

export class Inventory {
  private items: Map<number, InventorySlot> = new Map();
  private equipped: Map<string, InventorySlot> = new Map();
  private maxSlots = 28; // Real OSRS inventory size

  add(item: ItemDefinition, quantity = 1): boolean {
    const existing = this.items.get(item.id);
    if (existing && item.stackable) {
      existing.quantity += quantity;
      return true;
    }

    if (this.items.size >= this.maxSlots && !existing) {
      return false;
    }

    this.items.set(item.id, { item, quantity });
    return true;
  }

  remove(itemId: number, amount = 1): boolean {
    const slot = this.items.get(itemId);
    if (!slot) return false;

    if (slot.item.stackable) {
      slot.quantity -= amount;
      if (slot.quantity <= 0) {
        this.items.delete(itemId);
      }
      return true;
    }

    this.items.delete(itemId);
    return true;
  }

  has(itemId: number): boolean {
    return this.items.has(itemId);
  }

  get(itemId: number): InventorySlot | undefined {
    return this.items.get(itemId);
  }

  getAll(): InventorySlot[] {
    return Array.from(this.items.values());
  }

  equip(itemId: number): boolean {
    const slot = this.items.get(itemId);
    if (!slot || !slot.item.equipable || !slot.item.wearPos) {
      return false;
    }

    const wearPos = slot.item.wearPos;
    const currentEquipped = this.equipped.get(wearPos);
    if (currentEquipped) {
      this.items.set(currentEquipped.item.id, currentEquipped);
    }

    this.equipped.set(wearPos, slot);
    this.items.delete(itemId);
    return true;
  }

  unequip(wearPos: string): boolean {
    const slot = this.equipped.get(wearPos);
    if (!slot) return false;

    if (this.items.size >= this.maxSlots) {
      return false;
    }

    this.items.set(slot.item.id, slot);
    this.equipped.delete(wearPos);
    return true;
  }

  getEquipped(wearPos: string): InventorySlot | undefined {
    return this.equipped.get(wearPos);
  }

  getAllEquipped(): InventorySlot[] {
    return Array.from(this.equipped.values());
  }

  getTotalAttackBonus(): number {
    let bonus = 0;
    for (const slot of this.equipped.values()) {
      const stats = getEquipmentStats(slot.item.id);
      if (stats) {
        bonus += (stats.attackSlash ?? 0) + (stats.attackStab ?? 0) + (stats.attackCrush ?? 0);
      }
    }
    return bonus;
  }

  getTotalDefenseBonus(): number {
    let bonus = 0;
    for (const slot of this.equipped.values()) {
      const stats = getEquipmentStats(slot.item.id);
      if (stats) {
        bonus += (stats.defenceSlash ?? 0) + (stats.defenceStab ?? 0) + (stats.defenceCrush ?? 0);
      }
    }
    return bonus;
  }

  /**
   * Consume a food item from inventory.
   * Returns heal value if item is food and was consumed, undefined otherwise.
   */
  consume(itemId: number): number | undefined {
    const slot = this.items.get(itemId);
    if (!slot || !isFood(itemId)) {
      return undefined;
    }

    const healValue = getFoodHealValue(itemId);
    this.remove(itemId, 1);
    return healValue;
  }

  /**
   * Get item ID at inventory slot index (0-based).
   */
  getItemIdAtSlot(slotIndex: number): number | undefined {
    const items = Array.from(this.items.values());
    if (slotIndex < 0 || slotIndex >= items.length) {
      return undefined;
    }
    return items[slotIndex].item.id;
  }
}
