export class Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  children: Category[];
  active: boolean;
  sortOrder: number;
  createdAt: Date;

  constructor(id: string, name: string, parentId: string | null = null) {
    this.id = id;
    this.name = name.trim();
    this.slug = Category.toSlug(name);
    this.description = '';
    this.parentId = parentId;
    this.children = [];
    this.active = true;
    this.sortOrder = 0;
    this.createdAt = new Date();
  }

  static toSlug(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  addChild(child: Category): void {
    if (child.id === this.id) throw new Error('Category cannot be its own child');
    if (this.children.find(c => c.id === child.id)) throw new Error('Child already added');
    child.parentId = this.id;
    this.children.push(child);
  }

  removeChild(childId: string): void {
    const idx = this.children.findIndex(c => c.id === childId);
    if (idx === -1) throw new Error(`Child category '${childId}' not found`);
    this.children[idx].parentId = null;
    this.children.splice(idx, 1);
  }

  isRoot(): boolean {
    return this.parentId === null;
  }

  isLeaf(): boolean {
    return this.children.length === 0;
  }

  descendants(): Category[] {
    const result: Category[] = [];
    const traverse = (cat: Category) => {
      cat.children.forEach(c => { result.push(c); traverse(c); });
    };
    traverse(this);
    return result;
  }

  path(separator = ' > '): string {
    return this.name;
  }

  activate(): void { this.active = true; }
  deactivate(): void { this.active = false; }

  toString(): string {
    return `Category(${this.id}, "${this.name}", root=${this.isRoot()}, children=${this.children.length})`;
  }
}
