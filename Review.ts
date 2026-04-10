export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface ReviewVote {
  userId: string;
  helpful: boolean;
  createdAt: Date;
}

export class Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  votes: ReviewVote[];
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, productId: string, userId: string, rating: number, title: string, body: string) {
    if (rating < 1 || rating > 5) throw new RangeError('Rating must be between 1 and 5');
    this.id = id;
    this.productId = productId;
    this.userId = userId;
    this.rating = rating;
    this.title = title.trim();
    this.body = body.trim();
    this.status = 'pending';
    this.votes = [];
    this.verifiedPurchase = false;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  approve(): void {
    if (this.status === 'rejected') throw new Error('Cannot approve a rejected review');
    this.status = 'approved';
    this.updatedAt = new Date();
  }

  reject(reason?: string): void {
    this.status = 'rejected';
    if (reason) this.body = `[Rejected: ${reason}]`;
    this.updatedAt = new Date();
  }

  flag(): void {
    this.status = 'flagged';
    this.updatedAt = new Date();
  }

  vote(userId: string, helpful: boolean): void {
    const existing = this.votes.find(v => v.userId === userId);
    if (existing) {
      existing.helpful = helpful;
    } else {
      this.votes.push({ userId, helpful, createdAt: new Date() });
    }
  }

  helpfulScore(): number {
    if (this.votes.length === 0) return 0;
    const helpful = this.votes.filter(v => v.helpful).length;
    return parseFloat(((helpful / this.votes.length) * 100).toFixed(1));
  }

  markVerifiedPurchase(): void {
    this.verifiedPurchase = true;
    this.updatedAt = new Date();
  }

  edit(rating: number, title: string, body: string): void {
    if (rating < 1 || rating > 5) throw new RangeError('Rating must be between 1 and 5');
    this.rating = rating;
    this.title = title.trim();
    this.body = body.trim();
    this.status = 'pending';
    this.updatedAt = new Date();
  }

  toString(): string {
    return `Review(${this.id}, product=${this.productId}, ${this.rating}★, ${this.status})`;
  }
}
