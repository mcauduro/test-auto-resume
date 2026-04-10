export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export class Cart {
  id: string;
  userId: string;
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;

  constructor(id: string, userId: string, ttlMinutes = 60) {
    this.id = id;
    this.userId = userId;
    this.items = [];
    this.couponCode = null;
    this.couponDiscount = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
  }

  isExpired(): boolean {
    return Date.now() > this.expiresAt.getTime();
  }

  addItem(item: CartItem): void {
    if (this.isExpired()) throw new Error('Cart has expired');
    if (item.quantity <= 0) throw new RangeError('Quantity must be positive');
    const existing = this.items.find(i => i.sku === item.sku);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }
    this.updatedAt = new Date();
  }

  updateQuantity(sku: string, quantity: number): void {
    if (quantity < 0) throw new RangeError('Quantity cannot be negative');
    const item = this.items.find(i => i.sku === sku);
    if (!item) throw new Error(`Item '${sku}' not in cart`);
    if (quantity === 0) {
      this.items = this.items.filter(i => i.sku !== sku);
    } else {
      item.quantity = quantity;
    }
    this.updatedAt = new Date();
  }

  applyCoupon(code: string, discountAmount: number): void {
    if (discountAmount < 0) throw new RangeError('Discount cannot be negative');
    this.couponCode = code.toUpperCase().trim();
    this.couponDiscount = discountAmount;
    this.updatedAt = new Date();
  }

  subtotal(): number {
    return parseFloat(this.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0).toFixed(2));
  }

  total(): number {
    return parseFloat(Math.max(0, this.subtotal() - this.couponDiscount).toFixed(2));
  }

  itemCount(): number {
    return this.items.reduce((s, i) => s + i.quantity, 0);
  }

  clear(): void {
    this.items = [];
    this.couponCode = null;
    this.couponDiscount = 0;
    this.updatedAt = new Date();
  }

  merge(other: Cart): void {
    for (const item of other.items) {
      this.addItem(item);
    }
  }

  toString(): string {
    return `Cart(${this.id}, ${this.itemCount()} items, $${this.total()}${this.couponCode ? `, coupon: ${this.couponCode}` : ''})`;
  }
}
