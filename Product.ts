export type ProductStatus = 'active' | 'inactive' | 'out_of_stock' | 'discontinued';

export interface ProductVariant {
  sku: string;
  attributes: Record<string, string>; // e.g. { color: 'red', size: 'M' }
  price: number;
  stock: number;
}

export class Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  categoryId: string;
  status: ProductStatus;
  variants: ProductVariant[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, name: string, basePrice: number, categoryId: string) {
    if (basePrice < 0) throw new RangeError('Price cannot be negative');
    this.id = id;
    this.name = name.trim();
    this.description = '';
    this.basePrice = basePrice;
    this.categoryId = categoryId;
    this.status = 'active';
    this.variants = [];
    this.tags = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /** Adds a variant (e.g. size/color combination). */
  addVariant(variant: ProductVariant): void {
    const exists = this.variants.find(v => v.sku === variant.sku);
    if (exists) throw new Error(`Variant with SKU '${variant.sku}' already exists`);
    this.variants.push(variant);
    this.updatedAt = new Date();
  }

  /** Returns total available stock across all variants. */
  totalStock(): number {
    if (this.variants.length === 0) return 0;
    return this.variants.reduce((sum, v) => sum + v.stock, 0);
  }

  /** Adjusts stock for a specific variant SKU. */
  adjustStock(sku: string, delta: number): void {
    const variant = this.variants.find(v => v.sku === sku);
    if (!variant) throw new Error(`Variant '${sku}' not found`);
    if (variant.stock + delta < 0) throw new RangeError('Insufficient stock');
    variant.stock += delta;
    this.status = this.totalStock() === 0 ? 'out_of_stock' : 'active';
    this.updatedAt = new Date();
  }

  /** Applies a discount percentage and returns the discounted price. */
  discountedPrice(percent: number): number {
    if (percent < 0 || percent > 100) throw new RangeError('Percent must be 0–100');
    return parseFloat((this.basePrice * (1 - percent / 100)).toFixed(2));
  }

  /** Adds a searchable tag. */
  addTag(tag: string): void {
    const normalised = tag.toLowerCase().trim();
    if (!this.tags.includes(normalised)) this.tags.push(normalised);
  }

  /** Returns true if product matches a search term (name, description, tags). */
  matches(term: string): boolean {
    const t = term.toLowerCase();
    return (
      this.name.toLowerCase().includes(t) ||
      this.description.toLowerCase().includes(t) ||
      this.tags.some(tag => tag.includes(t))
    );
  }

  /** Marks product as discontinued. */
  discontinue(): void {
    this.status = 'discontinued';
    this.updatedAt = new Date();
  }

  toString(): string {
    return `Product(${this.id}, "${this.name}", $${this.basePrice}, ${this.status})`;
  }
}
