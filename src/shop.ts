import type { ItemDefinition } from "./data/ItemDefinition.ts";
import { getItem } from "./data/ItemDefinition.ts";

export interface ShopItem {
  itemId: number;
  price: number;
  stock?: number;
}

export class Shop {
  readonly name: string;
  private items: Map<number, ShopItem> = new Map();

  constructor(name: string, items: ShopItem[] = []) {
    this.name = name;
    for (const item of items) {
      this.items.set(item.itemId, item);
    }
  }

  getItems(): Array<{ item: ItemDefinition; price: number; stock?: number }> {
    const result: Array<{ item: ItemDefinition; price: number; stock?: number }> = [];
    for (const shopItem of this.items.values()) {
      if (shopItem.stock !== undefined && shopItem.stock <= 0) continue;
      const itemDef = getItem(shopItem.itemId);
      if (itemDef) {
        result.push({
          item: itemDef,
          price: shopItem.price,
          stock: shopItem.stock,
        });
      }
    }
    return result;
  }

  getItem(itemId: number): ShopItem | undefined {
    return this.items.get(itemId);
  }

  canBuy(itemId: number, gold: number): boolean {
    const shopItem = this.items.get(itemId);
    if (!shopItem) return false;
    if (shopItem.stock !== undefined && shopItem.stock <= 0) return false;
    return gold >= shopItem.price;
  }

  buy(itemId: number): ItemDefinition | null {
    const shopItem = this.items.get(itemId);
    if (!shopItem) return null;
    if (shopItem.stock !== undefined) {
      if (shopItem.stock <= 0) return null;
      shopItem.stock--;
    }
    return getItem(itemId) ?? null;
  }

  sell(itemId: number): number {
    const shopItem = this.items.get(itemId);
    const basePrice = shopItem?.price ?? 0;
    return Math.floor(basePrice * 0.5);
  }

  addStock(itemId: number, amount: number): void {
    const shopItem = this.items.get(itemId);
    if (shopItem && shopItem.stock !== undefined) {
      shopItem.stock += amount;
    }
  }
}
