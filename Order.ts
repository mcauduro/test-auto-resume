export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export class Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddressId: string;
  discountCode: string | null;
  discountAmount: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, userId: string, shippingAddressId: string) {
    this.id = id;
    this.userId = userId;
    this.status = 'pending';
    this.items = [];
    this.shippingAddressId = shippingAddressId;
    this.discountCode = null;
    this.discountAmount = 0;
    this.notes = '';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  addItem(item: OrderItem): void {
    if (this.status !== 'pending') throw new Error('Cannot modify a confirmed order');
    if (item.quantity <= 0) throw new RangeError('Quantity must be positive');
    const existing = this.items.find(i => i.sku === item.sku);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }
    this.updatedAt = new Date();
  }

  removeItem(sku: string): void {
    if (this.status !== 'pending') throw new Error('Cannot modify a confirmed order');
    const idx = this.items.findIndex(i => i.sku === sku);
    if (idx === -1) throw new Error(`Item '${sku}' not found`);
    this.items.splice(idx, 1);
    this.updatedAt = new Date();
  }

  subtotal(): number {
    return parseFloat(this.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0).toFixed(2));
  }

  total(): number {
    return parseFloat(Math.max(0, this.subtotal() - this.discountAmount).toFixed(2));
  }

  confirm(): void {
    if (this.items.length === 0) throw new Error('Cannot confirm an empty order');
    if (this.status !== 'pending') throw new Error(`Order is already ${this.status}`);
    this.status = 'confirmed';
    this.updatedAt = new Date();
  }

  cancel(reason?: string): void {
    const cancellable: OrderStatus[] = ['pending', 'confirmed', 'processing'];
    if (!cancellable.includes(this.status)) throw new Error(`Cannot cancel order in status '${this.status}'`);
    this.status = 'cancelled';
    if (reason) this.notes = reason;
    this.updatedAt = new Date();
  }

  advance(): void {
    const flow: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered'];
    const idx = flow.indexOf(this.status);
    if (idx === -1) throw new Error(`Cannot advance from status '${this.status}'`);
    if (idx === flow.length - 1) throw new Error('Order is already delivered');
    this.status = flow[idx + 1];
    this.updatedAt = new Date();
  }

  toString(): string {
    return `Order(${this.id}, user=${this.userId}, ${this.items.length} items, $${this.total()}, ${this.status})`;
  }
}
