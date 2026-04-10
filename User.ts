export type UserRole = 'admin' | 'manager' | 'customer' | 'guest';
export type UserStatus = 'active' | 'inactive' | 'banned' | 'pending';

export class User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;

  constructor(id: string, email: string, name: string, role: UserRole = 'customer') {
    this.id = id;
    this.email = email.toLowerCase().trim();
    this.name = name.trim();
    this.role = role;
    this.status = 'pending';
    this.passwordHash = '';
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.lastLoginAt = null;
  }

  /** Activates the user account. */
  activate(): void {
    if (this.status === 'banned') throw new Error('Cannot activate a banned user');
    this.status = 'active';
    this.updatedAt = new Date();
  }

  /** Bans the user, preventing login. */
  ban(): void {
    if (this.role === 'admin') throw new Error('Cannot ban an admin user');
    this.status = 'banned';
    this.updatedAt = new Date();
  }

  /** Records a successful login timestamp. */
  recordLogin(): void {
    if (this.status !== 'active') throw new Error(`User is ${this.status}`);
    this.lastLoginAt = new Date();
  }

  /** Promotes user to a new role. */
  promoteToRole(role: UserRole): void {
    this.role = role;
    this.updatedAt = new Date();
  }

  /** Returns whether user has a given permission based on role hierarchy. */
  hasPermission(requiredRole: UserRole): boolean {
    const hierarchy: UserRole[] = ['guest', 'customer', 'manager', 'admin'];
    return hierarchy.indexOf(this.role) >= hierarchy.indexOf(requiredRole);
  }

  /** Returns a safe public representation (no password hash). */
  toPublic(): Omit<User, 'passwordHash'> {
    const { passwordHash, ...pub } = this;
    return pub as Omit<User, 'passwordHash'>;
  }

  /** Updates name and/or email. */
  update(fields: Partial<{ name: string; email: string }>): void {
    if (fields.name) this.name = fields.name.trim();
    if (fields.email) this.email = fields.email.toLowerCase().trim();
    this.updatedAt = new Date();
  }

  toString(): string {
    return `User(${this.id}, ${this.email}, ${this.role}, ${this.status})`;
  }
}
