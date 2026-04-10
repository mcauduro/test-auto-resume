export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'void';

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g. 0.1 = 10%
}

export class Invoice {
  id: string;
  orderId: string;
  userId: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  issuedAt: Date | null;
  dueAt: Date | null;
  paidAt: Date | null;
  notes: string;
  createdAt: Date;

  constructor(id: string, orderId: string, userId: string) {
    this.id = id;
    this.orderId = orderId;
    this.userId = userId;
    this.status = 'draft';
    this.lines = [];
    this.issuedAt = null;
    this.dueAt = null;
    this.paidAt = null;
    this.notes = '';
    this.createdAt = new Date();
  }

  addLine(line: InvoiceLine): void {
    if (this.status !== 'draft') throw new Error('Can only edit draft invoices');
    if (line.quantity <= 0) throw new RangeError('Quantity must be positive');
    if (line.taxRate < 0 || line.taxRate > 1) throw new RangeError('Tax rate must be between 0 and 1');
    this.lines.push({ ...line });
  }

  subtotal(): number {
    return parseFloat(this.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0).toFixed(2));
  }

  taxTotal(): number {
    return parseFloat(this.lines.reduce((s, l) => s + l.unitPrice * l.quantity * l.taxRate, 0).toFixed(2));
  }

  grandTotal(): number {
    return parseFloat((this.subtotal() + this.taxTotal()).toFixed(2));
  }

  issue(dueDays = 30): void {
    if (this.status !== 'draft') throw new Error(`Invoice is already ${this.status}`);
    if (this.lines.length === 0) throw new Error('Cannot issue an empty invoice');
    this.status = 'issued';
    this.issuedAt = new Date();
    this.dueAt = new Date(Date.now() + dueDays * 86_400_000);
  }

  markPaid(): void {
    if (this.status !== 'issued' && this.status !== 'overdue') {
      throw new Error(`Cannot mark as paid from status '${this.status}'`);
    }
    this.status = 'paid';
    this.paidAt = new Date();
  }

  checkOverdue(): void {
    if (this.status === 'issued' && this.dueAt && new Date() > this.dueAt) {
      this.status = 'overdue';
    }
  }

  void(): void {
    if (this.status === 'paid') throw new Error('Cannot void a paid invoice');
    this.status = 'void';
  }

  summary(): string {
    return `Invoice #${this.id} | Subtotal: $${this.subtotal()} | Tax: $${this.taxTotal()} | Total: $${this.grandTotal()} | ${this.status}`;
  }

  toString(): string {
    return `Invoice(${this.id}, order=${this.orderId}, $${this.grandTotal()}, ${this.status})`;
  }
}
