export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  context: string;
  data: Record<string, unknown>;
  timestamp: Date;
  traceId: string | null;
}

export type LogTransport = (entry: LogEntry) => void;

export class Logger {
  private static levelOrder: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];

  context: string;
  minLevel: LogLevel;
  private entries: LogEntry[];
  private transports: LogTransport[];
  private maxEntries: number;
  private traceId: string | null;
  createdAt: Date;

  constructor(context: string, minLevel: LogLevel = 'info', maxEntries = 1000) {
    this.context = context;
    this.minLevel = minLevel;
    this.entries = [];
    this.transports = [Logger.consoleTransport()];
    this.maxEntries = maxEntries;
    this.traceId = null;
    this.createdAt = new Date();
  }

  private static consoleTransport(): LogTransport {
    return (entry) => {
      const ts = entry.timestamp.toISOString();
      const trace = entry.traceId ? ` [${entry.traceId}]` : '';
      const line = `${ts} [${entry.level.toUpperCase()}] [${entry.context}]${trace} ${entry.message}`;
      if (entry.level === 'error' || entry.level === 'fatal') console.error(line);
      else if (entry.level === 'warn') console.warn(line);
      else console.log(line);
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.levelOrder.indexOf(level) >= Logger.levelOrder.indexOf(this.minLevel);
  }

  private write(level: LogLevel, message: string, data: Record<string, unknown> = {}): LogEntry {
    if (!this.shouldLog(level)) return null as unknown as LogEntry;
    const entry: LogEntry = {
      id: Math.random().toString(36).slice(2),
      level, message, context: this.context, data,
      timestamp: new Date(), traceId: this.traceId,
    };
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) this.entries.shift();
    this.transports.forEach(t => t(entry));
    return entry;
  }

  debug(message: string, data?: Record<string, unknown>): LogEntry { return this.write('debug', message, data); }
  info(message: string, data?: Record<string, unknown>): LogEntry { return this.write('info', message, data); }
  warn(message: string, data?: Record<string, unknown>): LogEntry { return this.write('warn', message, data); }
  error(message: string, data?: Record<string, unknown>): LogEntry { return this.write('error', message, data); }
  fatal(message: string, data?: Record<string, unknown>): LogEntry { return this.write('fatal', message, data); }

  setTraceId(traceId: string | null): void {
    this.traceId = traceId;
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  clearTransports(): void {
    this.transports = [];
  }

  getEntries(level?: LogLevel): LogEntry[] {
    if (!level) return [...this.entries];
    return this.entries.filter(e => e.level === level);
  }

  since(from: Date): LogEntry[] {
    return this.entries.filter(e => e.timestamp >= from);
  }

  clear(): void {
    this.entries = [];
  }

  child(childContext: string): Logger {
    const child = new Logger(`${this.context}:${childContext}`, this.minLevel, this.maxEntries);
    child.traceId = this.traceId;
    child.clearTransports();
    this.transports.forEach(t => child.addTransport(t));
    return child;
  }

  toString(): string {
    return `Logger(context=${this.context}, minLevel=${this.minLevel}, entries=${this.entries.length})`;
  }
}
