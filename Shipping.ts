export type ShippingStatus = 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
export type ShippingCarrier = 'correios' | 'fedex' | 'dhl' | 'ups' | 'local';

export interface TrackingEvent {
  timestamp: Date;
  location: string;
  description: string;
  status: ShippingStatus;
}

export class Shipping {
  id: string;
  orderId: string;
  carrier: ShippingCarrier;
  trackingCode: string | null;
  status: ShippingStatus;
  estimatedDelivery: Date | null;
  weight: number;
  events: TrackingEvent[];
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, orderId: string, carrier: ShippingCarrier, weight: number) {
    if (weight <= 0) throw new RangeError('Weight must be positive');
    this.id = id;
    this.orderId = orderId;
    this.carrier = carrier;
    this.trackingCode = null;
    this.status = 'pending';
    this.estimatedDelivery = null;
    this.weight = weight;
    this.events = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  assignTracking(code: string, estimatedDelivery: Date): void {
    this.trackingCode = code.trim();
    this.estimatedDelivery = estimatedDelivery;
    this.updatedAt = new Date();
  }

  addEvent(location: string, description: string, status: ShippingStatus): void {
    this.events.push({ timestamp: new Date(), location, description, status });
    this.status = status;
    this.updatedAt = new Date();
  }

  isDelivered(): boolean {
    return this.status === 'delivered';
  }

  isLate(): boolean {
    if (!this.estimatedDelivery || this.isDelivered()) return false;
    return new Date() > this.estimatedDelivery;
  }

  shippingCost(): number {
    const rates: Record<ShippingCarrier, number> = {
      correios: 0.08, fedex: 0.15, dhl: 0.18, ups: 0.14, local: 0.05,
    };
    return parseFloat((this.weight * rates[this.carrier]).toFixed(2));
  }

  latestEvent(): TrackingEvent | null {
    return this.events.length ? this.events[this.events.length - 1] : null;
  }

  toString(): string {
    return `Shipping(${this.id}, ${this.carrier}, ${this.trackingCode ?? 'no tracking'}, ${this.status})`;
  }
}
