import type { InventoryItem } from "./inventory.ts";

export interface ShopItem extends InventoryItem {
  price: number;
  stock?: number;
}

export class Shop {
  readonly name: string;
  private items: Map<string, ShopItem> = new Map();

  constructor(name: string, items: ShopItem[] = []) {
    this.name = name;
    for (const item of items) {
      this.items.set(item.id, item);
    }
  }

  getItems(): ShopItem[] {
    return Array.from(this.items.values()).filter((item) =>
      item.stock === undefined || item.stock > 0
    );
  }

  getItem(itemId: string): ShopItem | undefined {
    return this.items.get(itemId);
  }

  canBuy(itemId: string, gold: number): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;
    if (item.stock !== undefined && item.stock <= 0) return false;
    return gold >= item.price;
  }

  buy(itemId: string): ShopItem | null {
    const item = this.items.get(itemId);
    if (!item) return null;
    if (item.stock !== undefined) {
      if (item.stock <= 0) return null;
      item.stock--;
    }
    return { ...item, quantity: 1 };
  }

  sell(item: InventoryItem): number {
    const basePrice = this.items.get(item.id)?.price ?? 0;
    return Math.floor(basePrice * 0.5);
  }

  addStock(itemId: string, amount: number): void {
    const item = this.items.get(itemId);
    if (item && item.stock !== undefined) {
      item.stock += amount;
    }
  }
}
