export type AddressType = 'residential' | 'commercial' | 'billing' | 'shipping';

export class Address {
  id: string;
  userId: string;
  type: AddressType;
  label: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, userId: string, data: {
    type: AddressType; label: string; street: string; number: string;
    city: string; state: string; country: string; postalCode: string;
    complement?: string; neighborhood?: string;
  }) {
    this.id = id;
    this.userId = userId;
    this.type = data.type;
    this.label = data.label.trim();
    this.street = data.street.trim();
    this.number = data.number.trim();
    this.complement = data.complement?.trim() ?? '';
    this.neighborhood = data.neighborhood?.trim() ?? '';
    this.city = data.city.trim();
    this.state = data.state.trim().toUpperCase();
    this.country = data.country.trim().toUpperCase();
    this.postalCode = data.postalCode.replace(/\D/g, '');
    this.isDefault = false;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  format(style: 'short' | 'full' = 'full'): string {
    const line1 = `${this.street}, ${this.number}${this.complement ? ` ${this.complement}` : ''}`;
    if (style === 'short') return `${line1}, ${this.city}/${this.state}`;
    return [line1, this.neighborhood, `${this.city} - ${this.state}`, this.postalCode, this.country]
      .filter(Boolean).join('\n');
  }

  update(fields: Partial<Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this, fields);
    this.updatedAt = new Date();
  }

  setAsDefault(): void {
    this.isDefault = true;
    this.updatedAt = new Date();
  }

  isValid(): boolean {
    return !!(this.street && this.number && this.city && this.state && this.postalCode && this.country);
  }

  matches(query: string): boolean {
    const q = query.toLowerCase();
    return [this.street, this.city, this.state, this.postalCode, this.label]
      .some(f => f.toLowerCase().includes(q));
  }

  clone(newId: string): Address {
    const cloned = new Address(newId, this.userId, {
      type: this.type, label: `${this.label} (copy)`,
      street: this.street, number: this.number, complement: this.complement,
      neighborhood: this.neighborhood, city: this.city, state: this.state,
      country: this.country, postalCode: this.postalCode,
    });
    return cloned;
  }

  toString(): string {
    return `Address(${this.id}, "${this.label}", ${this.city}/${this.state}, ${this.type})`;
  }
}
