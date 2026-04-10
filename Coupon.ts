export type CouponStatus = 'active' | 'expired' | 'exhausted' | 'disabled';

export interface CouponRedemption {
  userId: string;
  orderId: string;
  discountApplied: number;
  redeemedAt: Date;
}

export class Coupon {
  code: string;
  discountPercent: number;
  maxAmount: number | null;
  minOrderValue: number;
  maxRedemptions: number | null;
  redemptions: CouponRedemption[];
  onePerUser: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  disabled: boolean;

  constructor(code: string, discountPercent: number, options: {
    maxAmount?: number;
    minOrderValue?: number;
    maxRedemptions?: number;
    onePerUser?: boolean;
    expiresAt?: Date;
  } = {}) {
    if (discountPercent <= 0 || discountPercent > 100) throw new RangeError('Discount must be 1–100%');
    this.code = code.toUpperCase().trim();
    this.discountPercent = discountPercent;
    this.maxAmount = options.maxAmount ?? null;
    this.minOrderValue = options.minOrderValue ?? 0;
    this.maxRedemptions = options.maxRedemptions ?? null;
    this.onePerUser = options.onePerUser ?? false;
    this.expiresAt = options.expiresAt ?? null;
    this.redemptions = [];
    this.createdAt = new Date();
    this.disabled = false;
  }

  status(): CouponStatus {
    if (this.disabled) return 'disabled';
    if (this.expiresAt && new Date() > this.expiresAt) return 'expired';
    if (this.maxRedemptions !== null && this.redemptions.length >= this.maxRedemptions) return 'exhausted';
    return 'active';
  }

  canRedeem(userId: string, orderValue: number): { valid: boolean; reason?: string } {
    if (this.status() !== 'active') return { valid: false, reason: `Coupon is ${this.status()}` };
    if (orderValue < this.minOrderValue) return { valid: false, reason: `Minimum order value is $${this.minOrderValue}` };
    if (this.onePerUser && this.redemptions.some(r => r.userId === userId)) {
      return { valid: false, reason: 'Coupon already used by this user' };
    }
    return { valid: true };
  }

  calculateDiscount(orderValue: number): number {
    let discount = orderValue * (this.discountPercent / 100);
    if (this.maxAmount !== null) discount = Math.min(discount, this.maxAmount);
    return parseFloat(discount.toFixed(2));
  }

  redeem(userId: string, orderId: string, orderValue: number): number {
    const { valid, reason } = this.canRedeem(userId, orderValue);
    if (!valid) throw new Error(reason);
    const discount = this.calculateDiscount(orderValue);
    this.redemptions.push({ userId, orderId, discountApplied: discount, redeemedAt: new Date() });
    return discount;
  }

  usageStats(): { total: number; totalDiscount: number; uniqueUsers: number } {
    const total = this.redemptions.length;
    const totalDiscount = parseFloat(this.redemptions.reduce((s, r) => s + r.discountApplied, 0).toFixed(2));
    const uniqueUsers = new Set(this.redemptions.map(r => r.userId)).size;
    return { total, totalDiscount, uniqueUsers };
  }

  disable(): void { this.disabled = true; }
  enable(): void { this.disabled = false; }

  toString(): string {
    return `Coupon(${this.code}, ${this.discountPercent}% off, ${this.status()}, used ${this.redemptions.length}x)`;
  }
}
