export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export class Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  readAt: Date | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;

  constructor(id: string, userId: string, type: NotificationType, channel: NotificationChannel, title: string, body: string) {
    this.id = id;
    this.userId = userId;
    this.type = type;
    this.channel = channel;
    this.title = title.trim();
    this.body = body.trim();
    this.data = {};
    this.read = false;
    this.readAt = null;
    this.sentAt = null;
    this.deliveredAt = null;
    this.expiresAt = null;
    this.createdAt = new Date();
  }

  markSent(): void {
    if (this.sentAt) throw new Error('Notification already sent');
    this.sentAt = new Date();
  }

  markDelivered(): void {
    if (!this.sentAt) throw new Error('Notification not yet sent');
    this.deliveredAt = new Date();
  }

  markRead(): void {
    if (this.read) return;
    if (this.isExpired()) throw new Error('Notification has expired');
    this.read = true;
    this.readAt = new Date();
  }

  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  setExpiry(ttlHours: number): void {
    this.expiresAt = new Date(Date.now() + ttlHours * 3_600_000);
  }

  withData(key: string, value: unknown): this {
    this.data[key] = value;
    return this;
  }

  summary(): string {
    return `[${this.type.toUpperCase()}] ${this.title}: ${this.body}`;
  }

  toString(): string {
    return `Notification(${this.id}, ${this.userId}, ${this.type}, ${this.channel}, read=${this.read})`;
  }
}
