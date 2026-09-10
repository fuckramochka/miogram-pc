/**
 * MiogramKanbanStorage: Persistent task board storage.
 * Ported 1:1 from app.miogram.bridge.kanban.MiogramKanbanStorage.java.
 *
 * 4 Canonical Columns:
 * 0: Inbox / Вхідні
 * 1: In Progress / В роботі
 * 2: Important / Важливе
 * 3: Done / Виконано
 */

import { MiogramLocale } from '../localizer/MiogramLocale';

export interface KanbanItem {
  id: string;
  title: string;
  description: string;
  column: number; // 0, 1, 2, 3
  dialogId?: number;
  messageId?: number;
  createdAt: number;
}

const STORAGE_KEY = 'miogram_kanban_items_json';

export class MiogramKanbanStorage {
  public static getColumnTitles(): string[] {
    return [
      MiogramLocale.get('📥 Вхідні', '📥 Входящие', '📥 Inbox'),
      MiogramLocale.get('⏳ В роботі', '⏳ В работе', '⏳ In Progress'),
      MiogramLocale.get('🔔 Важливе', '🔔 Важное', '🔔 Important'),
      MiogramLocale.get('✅ Виконано', '✅ Выполнено', '✅ Done'),
    ];
  }

  public static loadItems(): KanbanItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore parse error
    }
    return [];
  }

  public static saveItems(items: KanbanItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota error
    }
  }

  public static addItem(item: Omit<KanbanItem, 'id' | 'createdAt'>): KanbanItem {
    const fullItem: KanbanItem = {
      ...item,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now(),
    };
    const current = this.loadItems();
    current.push(fullItem);
    this.saveItems(current);
    return fullItem;
  }

  public static updateItemColumn(id: string, newColumn: number): void {
    const current = this.loadItems();
    const item = current.find((i) => i.id === id);
    if (item) {
      item.column = newColumn;
      this.saveItems(current);
    }
  }

  public static deleteItem(id: string): void {
    const current = this.loadItems().filter((i) => i.id !== id);
    this.saveItems(current);
  }
}

export default MiogramKanbanStorage;
