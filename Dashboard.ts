export type WidgetType = 'chart' | 'metric' | 'table' | 'map' | 'text';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  config: Record<string, unknown>;
  position: { row: number; col: number; width: number; height: number };
  refreshIntervalSec: number;
}

export class Dashboard {
  id: string;
  name: string;
  ownerId: string;
  widgets: Widget[];
  sharedWith: string[];
  isPublic: boolean;
  tags: string[];
  refreshAll: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, name: string, ownerId: string) {
    this.id = id;
    this.name = name.trim();
    this.ownerId = ownerId;
    this.widgets = [];
    this.sharedWith = [];
    this.isPublic = false;
    this.tags = [];
    this.refreshAll = 300;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  addWidget(widget: Widget): void {
    if (this.widgets.find(w => w.id === widget.id)) throw new Error(`Widget '${widget.id}' already exists`);
    if (widget.position.width < 1 || widget.position.height < 1) throw new RangeError('Widget size must be at least 1x1');
    this.widgets.push({ ...widget });
    this.updatedAt = new Date();
  }

  removeWidget(widgetId: string): void {
    const idx = this.widgets.findIndex(w => w.id === widgetId);
    if (idx === -1) throw new Error(`Widget '${widgetId}' not found`);
    this.widgets.splice(idx, 1);
    this.updatedAt = new Date();
  }

  moveWidget(widgetId: string, position: Partial<Widget['position']>): void {
    const widget = this.widgets.find(w => w.id === widgetId);
    if (!widget) throw new Error(`Widget '${widgetId}' not found`);
    Object.assign(widget.position, position);
    this.updatedAt = new Date();
  }

  shareWith(userId: string): void {
    if (!this.sharedWith.includes(userId)) this.sharedWith.push(userId);
    this.updatedAt = new Date();
  }

  revokeAccess(userId: string): void {
    this.sharedWith = this.sharedWith.filter(id => id !== userId);
    this.updatedAt = new Date();
  }

  canView(userId: string): boolean {
    return this.isPublic || this.ownerId === userId || this.sharedWith.includes(userId);
  }

  canEdit(userId: string): boolean {
    return this.ownerId === userId;
  }

  widgetsByType(type: WidgetType): Widget[] {
    return this.widgets.filter(w => w.type === type);
  }

  rename(name: string): void {
    if (!name.trim()) throw new Error('Name cannot be empty');
    this.name = name.trim();
    this.updatedAt = new Date();
  }

  toString(): string {
    return `Dashboard(${this.id}, "${this.name}", ${this.widgets.length} widgets, owner=${this.ownerId})`;
  }
}
