export type DiscountType = 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';
export type DiscountTarget = 'order' | 'product' | 'category';

export class Discount {
  id: string;
  name: string;
  type: DiscountType;
  target: DiscountTarget;
  targetId: string | null;
  value: number;
  minOrderAmount: number;
  maxUsages: number | null;
  usageCount: number;
  active: boolean;
  startsAt: Date;
  expiresAt: Date | null;
  createdAt: Date;

  constructor(id: string, name: string, type: DiscountType, value: number, target: DiscountTarget = 'order') {
    if (value < 0) throw new RangeError('Discount value cannot be negative');
    if (type === 'percentage' && value > 100) throw new RangeError('Percentage cannot exceed 100');
    this.id = id;
    this.name = name.trim();
    this.type = type;
    this.target = target;
    this.targetId = null;
    this.value = value;
    this.minOrderAmount = 0;
    this.maxUsages = null;
    this.usageCount = 0;
    this.active = true;
    this.startsAt = new Date();
    this.expiresAt = null;
    this.createdAt = new Date();
  }

  isValid(orderAmount: number): boolean {
    if (!this.active) return false;
    if (new Date() < this.startsAt) return false;
    if (this.expiresAt && new Date() > this.expiresAt) return false;
    if (this.maxUsages !== null && this.usageCount >= this.maxUsages) return false;
    if (orderAmount < this.minOrderAmount) return false;
    return true;
  }

  apply(orderAmount: number): number {
    if (!this.isValid(orderAmount)) throw new Error('Discount is not valid for this order');
    let discounted = orderAmount;
    if (this.type === 'percentage') {
      discounted = orderAmount * (1 - this.value / 100);
    } else if (this.type === 'fixed') {
      discounted = Math.max(0, orderAmount - this.value);
    }
    return parseFloat(discounted.toFixed(2));
  }

  savings(orderAmount: number): number {
    return parseFloat((orderAmount - this.apply(orderAmount)).toFixed(2));
  }

  redeem(): void {
    if (this.maxUsages !== null && this.usageCount >= this.maxUsages) {
      throw new Error('Discount usage limit reached');
    }
    this.usageCount++;
  }

  setExpiry(date: Date): void {
    if (date <= new Date()) throw new RangeError('Expiry must be in the future');
    this.expiresAt = date;
  }

  deactivate(): void { this.active = false; }
  activate(): void { this.active = true; }

  toString(): string {
    const val = this.type === 'percentage' ? `${this.value}%` : `$${this.value}`;
    return `Discount(${this.id}, "${this.name}", ${val} off, ${this.active ? 'active' : 'inactive'})`;
  }
}
