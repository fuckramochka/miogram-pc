import { useState, useCallback } from '../../lib/teact/teact';
import { MiogramLocale } from '../localizer/MiogramLocale';

export type SubfolderFilterType = 'all' | 'personal' | 'groups' | 'channels' | 'bots' | 'unread';

type OwnProps = {
  activeFilter?: SubfolderFilterType;
  counts?: Partial<Record<SubfolderFilterType, number>>;
  onFilterChange?: (filter: SubfolderFilterType) => void;
};

export const MiogramSubfolderBar = ({
  activeFilter: propFilter,
  counts = {},
  onFilterChange,
}: OwnProps) => {
  const [internalFilter, setInternalFilter] = useState<SubfolderFilterType>('all');
  const activeFilter = propFilter ?? internalFilter;

  const handleFilterClick = useCallback((id: SubfolderFilterType) => {
    setInternalFilter(id);
    onFilterChange?.(id);
  }, [onFilterChange]);

  const filters: Array<{ id: SubfolderFilterType; labelUk: string; labelRu: string; labelEn: string; icon: string }> = [
    { id: 'all', labelUk: 'Всі', labelRu: 'Все', labelEn: 'All', icon: '✦' },
    { id: 'personal', labelUk: 'Особисті', labelRu: 'Личные', labelEn: 'Personal', icon: '👤' },
    { id: 'groups', labelUk: 'Групи', labelRu: 'Группы', labelEn: 'Groups', icon: '👥' },
    { id: 'channels', labelUk: 'Канали', labelRu: 'Каналы', labelEn: 'Channels', icon: '📢' },
    { id: 'bots', labelUk: 'Боти', labelRu: 'Боты', labelEn: 'Bots', icon: '🤖' },
    { id: 'unread', labelUk: 'Непрочитані', labelRu: 'Непрочитанные', labelEn: 'Unread', icon: '📬' },
  ];

  return (
    <div
      style="display: flex; gap: 0.35rem; padding: 0.35rem 0.75rem; overflow-x: auto; scrollbar-width: none; background: rgba(0,0,0,0.1); border-bottom: 1px solid var(--color-borders); z-index: 5;"
    >
      {filters.map((f) => {
        const isActive = activeFilter === f.id;
        const count = counts[f.id];
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => handleFilterClick(f.id)}
            style={`display: flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.65rem; border-radius: 1rem; border: none; font-size: 0.8rem; font-weight: 600; white-space: nowrap; cursor: pointer; transition: all 0.2s ease; background: ${isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)'}; color: ${isActive ? '#FFFFFF' : 'var(--color-text)'};`}
          >
            <span style="font-size: 0.85rem;">{f.icon}</span>
            <span>{MiogramLocale.get(f.labelUk, f.labelRu, f.labelEn)}</span>
            {Boolean(count) && (
              <span
                style={`font-size: 0.65rem; padding: 0.1rem 0.35rem; border-radius: 0.5rem; background: ${isActive ? 'rgba(0,0,0,0.25)' : 'var(--color-primary)'}; color: #fff;`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MiogramSubfolderBar;
