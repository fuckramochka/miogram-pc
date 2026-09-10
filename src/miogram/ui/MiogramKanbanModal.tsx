import { useState, useCallback } from '../../lib/teact/teact';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { MiogramKanbanStorage, type KanbanItem } from '../kanban/MiogramKanbanStorage';
import { MiogramLocale } from '../localizer/MiogramLocale';

type OwnProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const MiogramKanbanModal = ({ isOpen, onClose }: OwnProps) => {
  const [items, setItems] = useState<KanbanItem[]>(MiogramKanbanStorage.loadItems());
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const columnTitles = MiogramKanbanStorage.getColumnTitles();

  const handleAdd = useCallback(() => {
    if (!newTitle.trim()) return;
    const added = MiogramKanbanStorage.addItem({
      title: newTitle.trim(),
      description: newDesc.trim(),
      column: 0,
    });
    setItems((prev) => [...prev, added]);
    setNewTitle('');
    setNewDesc('');
    setIsAdding(false);
  }, [newTitle, newDesc]);

  const handleMove = useCallback((id: string, newCol: number) => {
    if (newCol < 0 || newCol > 3) return;
    MiogramKanbanStorage.updateItemColumn(id, newCol);
    setItems(MiogramKanbanStorage.loadItems());
  }, []);

  const handleDelete = useCallback((id: string) => {
    MiogramKanbanStorage.deleteItem(id);
    setItems(MiogramKanbanStorage.loadItems());
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={MiogramLocale.get('Канбан-дошка завдань ໒꒱', 'Канбан-доска задач ໒꒱', 'Kanban Task Board ໒꒱')}
      hasCloseButton
      className="miogram-kanban-modal"
    >
      <div style="display: flex; flex-direction: column; width: 100%; min-width: 50rem; height: 35rem; padding: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div style="font-size: 0.875rem; color: rgba(255,255,255,0.6);">
            {MiogramLocale.get('Організація збережених чатів і тасок', 'Организация сохраненных чатов и тасок', 'Organize chats and tasks')}
          </div>
          <Button size="smaller" onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? '✕ Скасувати' : '+ Нова картка'}
          </Button>
        </div>

        {isAdding && (
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; padding: 0.75rem; border-radius: 0.5rem; background: rgba(255,255,255,0.05);">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle((e.target as HTMLInputElement).value)}
              placeholder="Заголовок картки..."
              style="flex: 1; padding: 0.5rem; border-radius: 0.35rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #fff;"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc((e.target as HTMLInputElement).value)}
              placeholder="Опис / нотатка..."
              style="flex: 2; padding: 0.5rem; border-radius: 0.35rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #fff;"
            />
            <Button size="smaller" onClick={handleAdd}>Зберегти</Button>
          </div>
        )}

        {/* 4 Columns Board */}
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; flex: 1; overflow-x: auto;">
          {columnTitles.map((colTitle, colIdx) => {
            const colItems = items.filter((i) => i.column === colIdx);
            return (
              <div
                key={colIdx}
                style="display: flex; flex-direction: column; background: rgba(255,255,255,0.04); border-radius: 0.75rem; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.08);"
              >
                <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between;">
                  <span>{colTitle}</span>
                  <span style="opacity: 0.5;">{colItems.length}</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1; overflow-y: auto;">
                  {colItems.map((item) => (
                    <div
                      key={item.id}
                      style="background: rgba(255,255,255,0.07); border-radius: 0.5rem; padding: 0.65rem; border: 1px solid rgba(255,255,255,0.12);"
                    >
                      <div style="font-weight: 600; font-size: 0.9rem; color: #fff;">{item.title}</div>
                      {item.description && (
                        <div style="font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-top: 0.25rem;">
                          {item.description}
                        </div>
                      )}
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                        <button
                          type="button"
                          onClick={() => handleMove(item.id, colIdx - 1)}
                          disabled={colIdx === 0}
                          style="background: none; border: none; color: #fff; opacity: 0.5; cursor: pointer;"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          style="background: none; border: none; color: #FF3B30; opacity: 0.6; cursor: pointer; font-size: 0.75rem;"
                        >
                          ✕
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(item.id, colIdx + 1)}
                          disabled={colIdx === 3}
                          style="background: none; border: none; color: #fff; opacity: 0.5; cursor: pointer;"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default MiogramKanbanModal;
