export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  addedAt: Date;
  note: string;
  notifyOnPriceDrop: boolean;
}

export class Wishlist {
  id: string;
  userId: string;
  name: string;
  items: WishlistItem[];
  isPublic: boolean;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, userId: string, name = 'My Wishlist') {
    this.id = id;
    this.userId = userId;
    this.name = name.trim();
    this.items = [];
    this.isPublic = false;
    this.shareToken = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  addItem(productId: string, name: string, price: number, note = ''): void {
    if (this.items.find(i => i.productId === productId)) {
      throw new Error(`Product '${productId}' already in wishlist`);
    }
    this.items.push({ productId, name, price, addedAt: new Date(), note, notifyOnPriceDrop: false });
    this.updatedAt = new Date();
  }

  removeItem(productId: string): void {
    const idx = this.items.findIndex(i => i.productId === productId);
    if (idx === -1) throw new Error(`Product '${productId}' not in wishlist`);
    this.items.splice(idx, 1);
    this.updatedAt = new Date();
  }

  updatePrice(productId: string, newPrice: number): { dropped: boolean; diff: number } {
    const item = this.items.find(i => i.productId === productId);
    if (!item) throw new Error(`Product '${productId}' not in wishlist`);
    const diff = parseFloat((item.price - newPrice).toFixed(2));
    const dropped = newPrice < item.price;
    item.price = newPrice;
    this.updatedAt = new Date();
    return { dropped, diff };
  }

  totalValue(): number {
    return parseFloat(this.items.reduce((s, i) => s + i.price, 0).toFixed(2));
  }

  makePublic(): string {
    this.isPublic = true;
    this.shareToken = Math.random().toString(36).slice(2, 10).toUpperCase();
    this.updatedAt = new Date();
    return this.shareToken;
  }

  makePrivate(): void {
    this.isPublic = false;
    this.shareToken = null;
    this.updatedAt = new Date();
  }

  toggleNotification(productId: string): boolean {
    const item = this.items.find(i => i.productId === productId);
    if (!item) throw new Error(`Product '${productId}' not in wishlist`);
    item.notifyOnPriceDrop = !item.notifyOnPriceDrop;
    return item.notifyOnPriceDrop;
  }

  toString(): string {
    return `Wishlist(${this.id}, "${this.name}", ${this.items.length} items, $${this.totalValue()})`;
  }
}
