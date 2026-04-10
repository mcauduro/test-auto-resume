export type ReportStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ReportFormat = 'json' | 'csv' | 'pdf' | 'xlsx';

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: unknown;
}

export interface ReportSection {
  title: string;
  data: Record<string, unknown>[];
}

export class Report {
  id: string;
  name: string;
  description: string;
  status: ReportStatus;
  format: ReportFormat;
  filters: ReportFilter[];
  sections: ReportSection[];
  generatedBy: string;
  startedAt: Date | null;
  completedAt: Date | null;
  fileUrl: string | null;
  fileSizeBytes: number;
  error: string | null;
  createdAt: Date;

  constructor(id: string, name: string, generatedBy: string, format: ReportFormat = 'json') {
    this.id = id;
    this.name = name.trim();
    this.description = '';
    this.status = 'pending';
    this.format = format;
    this.filters = [];
    this.sections = [];
    this.generatedBy = generatedBy;
    this.startedAt = null;
    this.completedAt = null;
    this.fileUrl = null;
    this.fileSizeBytes = 0;
    this.error = null;
    this.createdAt = new Date();
  }

  addFilter(filter: ReportFilter): void {
    const exists = this.filters.find(f => f.field === filter.field && f.operator === filter.operator);
    if (exists) throw new Error(`Filter on '${filter.field}' with operator '${filter.operator}' already exists`);
    this.filters.push(filter);
  }

  addSection(title: string, data: Record<string, unknown>[]): void {
    this.sections.push({ title, data });
  }

  start(): void {
    if (this.status !== 'pending') throw new Error(`Cannot start report in status '${this.status}'`);
    this.status = 'running';
    this.startedAt = new Date();
  }

  complete(fileUrl: string, fileSizeBytes: number): void {
    if (this.status !== 'running') throw new Error('Report is not running');
    this.status = 'completed';
    this.fileUrl = fileUrl;
    this.fileSizeBytes = fileSizeBytes;
    this.completedAt = new Date();
  }

  fail(error: string): void {
    this.status = 'failed';
    this.error = error;
    this.completedAt = new Date();
  }

  durationMs(): number | null {
    if (!this.startedAt) return null;
    const end = this.completedAt ?? new Date();
    return end.getTime() - this.startedAt.getTime();
  }

  rowCount(): number {
    return this.sections.reduce((s, sec) => s + sec.data.length, 0);
  }

  applyFilters(records: Record<string, unknown>[]): Record<string, unknown>[] {
    return records.filter(record =>
      this.filters.every(f => {
        const val = record[f.field];
        switch (f.operator) {
          case 'eq': return val === f.value;
          case 'neq': return val !== f.value;
          case 'gt': return (val as number) > (f.value as number);
          case 'lt': return (val as number) < (f.value as number);
          case 'gte': return (val as number) >= (f.value as number);
          case 'lte': return (val as number) <= (f.value as number);
          case 'contains': return String(val).toLowerCase().includes(String(f.value).toLowerCase());
          default: return true;
        }
      })
    );
  }

  toString(): string {
    return `Report(${this.id}, "${this.name}", ${this.format}, ${this.status}, ${this.rowCount()} rows)`;
  }
}
