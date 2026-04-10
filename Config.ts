export type ConfigEnv = 'development' | 'staging' | 'production' | 'test';

export class Config {
  private store: Map<string, unknown>;
  private env: ConfigEnv;
  private frozen: boolean;
  private validators: Map<string, (v: unknown) => boolean>;
  createdAt: Date;

  constructor(env: ConfigEnv = 'development') {
    this.store = new Map();
    this.env = env;
    this.frozen = false;
    this.validators = new Map();
    this.createdAt = new Date();
  }

  set<T>(key: string, value: T): void {
    if (this.frozen) throw new Error('Config is frozen and cannot be modified');
    const validator = this.validators.get(key);
    if (validator && !validator(value)) throw new Error(`Invalid value for config key '${key}'`);
    this.store.set(key, value);
  }

  get<T>(key: string, defaultValue?: T): T {
    if (!this.store.has(key)) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Config key '${key}' not found`);
    }
    return this.store.get(key) as T;
  }

  getOrThrow<T>(key: string): T {
    if (!this.store.has(key)) throw new Error(`Required config key '${key}' is missing`);
    return this.store.get(key) as T;
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  registerValidator(key: string, validator: (v: unknown) => boolean): void {
    this.validators.set(key, validator);
  }

  loadFromEnv(mapping: Record<string, string>): void {
    for (const [key, envVar] of Object.entries(mapping)) {
      const val = process.env[envVar];
      if (val !== undefined) this.set(key, val);
    }
  }

  merge(other: Config): void {
    if (this.frozen) throw new Error('Config is frozen');
    for (const [key, value] of other.store.entries()) {
      this.set(key, value);
    }
  }

  freeze(): void {
    this.frozen = true;
  }

  isFrozen(): boolean {
    return this.frozen;
  }

  isProduction(): boolean {
    return this.env === 'production';
  }

  isDevelopment(): boolean {
    return this.env === 'development';
  }

  toObject(): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of this.store.entries()) obj[k] = v;
    return obj;
  }

  toString(): string {
    return `Config(env=${this.env}, keys=${this.store.size}, frozen=${this.frozen})`;
  }
}
