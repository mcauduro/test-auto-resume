export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'wallet';

export interface RefundRecord {
  id: string;
  amount: number;
  reason: string;
  refundedAt: Date;
}

export class Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayTransactionId: string | null;
  refunds: RefundRecord[];
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, orderId: string, userId: string, amount: number, method: PaymentMethod, currency = 'BRL') {
    if (amount <= 0) throw new RangeError('Payment amount must be positive');
    this.id = id;
    this.orderId = orderId;
    this.userId = userId;
    this.amount = amount;
    this.currency = currency;
    this.method = method;
    this.status = 'pending';
    this.gatewayTransactionId = null;
    this.refunds = [];
    this.failureReason = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  process(gatewayTransactionId: string): void {
    if (this.status !== 'pending') throw new Error(`Cannot process payment in status '${this.status}'`);
    this.status = 'processing';
    this.gatewayTransactionId = gatewayTransactionId;
    this.updatedAt = new Date();
  }

  complete(): void {
    if (this.status !== 'processing') throw new Error(`Cannot complete payment in status '${this.status}'`);
    this.status = 'completed';
    this.updatedAt = new Date();
  }

  fail(reason: string): void {
    if (this.status === 'completed') throw new Error('Cannot fail a completed payment');
    this.status = 'failed';
    this.failureReason = reason;
    this.updatedAt = new Date();
  }

  refund(amount: number, reason: string): RefundRecord {
    if (this.status !== 'completed' && this.status !== 'partially_refunded') {
      throw new Error(`Cannot refund payment in status '${this.status}'`);
    }
    const alreadyRefunded = this.refundedAmount();
    if (amount <= 0) throw new RangeError('Refund amount must be positive');
    if (alreadyRefunded + amount > this.amount) {
      throw new RangeError(`Refund exceeds original amount ($${this.amount})`);
    }
    const record: RefundRecord = {
      id: crypto.randomUUID(),
      amount,
      reason,
      refundedAt: new Date(),
    };
    this.refunds.push(record);
    this.status = alreadyRefunded + amount >= this.amount ? 'refunded' : 'partially_refunded';
    this.updatedAt = new Date();
    return record;
  }

  refundedAmount(): number {
    return parseFloat(this.refunds.reduce((s, r) => s + r.amount, 0).toFixed(2));
  }

  netAmount(): number {
    return parseFloat((this.amount - this.refundedAmount()).toFixed(2));
  }

  toString(): string {
    return `Payment(${this.id}, $${this.amount} ${this.currency}, ${this.method}, ${this.status})`;
  }
}
