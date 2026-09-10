import { useState, useCallback } from '../../lib/teact/teact';
import { MiogramLocale } from '../localizer/MiogramLocale';

type OwnProps = {
  primaryPane: React.ReactNode;
  secondaryPane?: React.ReactNode;
  onCloseSecondary?: () => void;
};

export const MiogramSplitChat = ({
  primaryPane,
  secondaryPane,
  onCloseSecondary,
}: OwnProps) => {
  const [splitRatio, setSplitRatio] = useState(50); // percentage 50%

  if (!secondaryPane) {
    return <div style="width: 100%; height: 100%;">{primaryPane}</div>;
  }

  return (
    <div style="display: flex; width: 100%; height: 100%; overflow: hidden; position: relative;">
      {/* Primary Pane */}
      <div style={`width: ${splitRatio}%; height: 100%; overflow: hidden;`}>
        {primaryPane}
      </div>

      {/* Split Divider */}
      <div
        style="width: 6px; height: 100%; background: var(--color-borders); cursor: col-resize; z-index: 10; display: flex; align-items: center; justify-content: center;"
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startRatio = splitRatio;
          const containerWidth = (e.currentTarget.parentElement?.clientWidth || 1000);

          const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newRatio = Math.min(80, Math.max(20, startRatio + (deltaX / containerWidth) * 100));
            setSplitRatio(newRatio);
          };

          const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
          };

          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        }}
      >
        <div style="width: 2px; height: 2rem; background: rgba(255,255,255,0.4); border-radius: 1px;" />
      </div>

      {/* Secondary Pane */}
      <div style={`width: ${100 - splitRatio}%; height: 100%; overflow: hidden; position: relative;`}>
        {onCloseSecondary && (
          <button
            type="button"
            onClick={onCloseSecondary}
            title={MiogramLocale.get('Закрити спліт-вікно', 'Закрыть сплит-окно', 'Close split window')}
            style="position: absolute; top: 0.5rem; right: 0.5rem; z-index: 20; background: rgba(0,0,0,0.5); border: none; border-radius: 50%; width: 1.75rem; height: 1.75rem; color: #fff; cursor: pointer;"
          >
            ✕
          </button>
        )}
        {secondaryPane}
      </div>
    </div>
  );
};

export default MiogramSplitChat;
