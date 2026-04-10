export type EmailStatus = 'draft' | 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';

export interface EmailAttachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
  url: string;
}

export class Email {
  id: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  htmlBody: string;
  textBody: string;
  attachments: EmailAttachment[];
  status: EmailStatus;
  messageId: string | null;
  attempts: number;
  lastError: string | null;
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;

  constructor(id: string, from: string, to: string | string[], subject: string) {
    this.id = id;
    this.from = from.trim().toLowerCase();
    this.to = (Array.isArray(to) ? to : [to]).map(e => e.trim().toLowerCase());
    this.cc = [];
    this.bcc = [];
    this.subject = subject.trim();
    this.htmlBody = '';
    this.textBody = '';
    this.attachments = [];
    this.status = 'draft';
    this.messageId = null;
    this.attempts = 0;
    this.lastError = null;
    this.scheduledAt = null;
    this.sentAt = null;
    this.createdAt = new Date();
  }

  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  addRecipients(emails: string[], field: 'to' | 'cc' | 'bcc' = 'to'): void {
    const valid = emails.map(e => e.trim().toLowerCase()).filter(Email.isValidEmail);
    if (valid.length !== emails.length) throw new Error('One or more invalid email addresses');
    this[field].push(...valid);
  }

  setBody(html: string, text?: string): void {
    this.htmlBody = html;
    this.textBody = text ?? html.replace(/<[^>]+>/g, '').trim();
  }

  attach(attachment: EmailAttachment): void {
    const totalSize = this.attachments.reduce((s, a) => s + a.sizeBytes, 0) + attachment.sizeBytes;
    if (totalSize > 25 * 1024 * 1024) throw new Error('Total attachments exceed 25MB limit');
    this.attachments.push(attachment);
  }

  schedule(sendAt: Date): void {
    if (sendAt <= new Date()) throw new RangeError('Scheduled time must be in the future');
    this.scheduledAt = sendAt;
    this.status = 'queued';
  }

  recordSent(messageId: string): void {
    this.messageId = messageId;
    this.status = 'sent';
    this.sentAt = new Date();
    this.attempts++;
  }

  recordFailure(error: string): void {
    this.lastError = error;
    this.attempts++;
    this.status = this.attempts >= 3 ? 'failed' : 'queued';
  }

  allRecipients(): string[] {
    return [...new Set([...this.to, ...this.cc, ...this.bcc])];
  }

  toString(): string {
    return `Email(${this.id}, from=${this.from}, to=${this.to.join(',')}, "${this.subject}", ${this.status})`;
  }
}
