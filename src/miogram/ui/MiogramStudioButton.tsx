import { useState } from '../../lib/teact/teact';
import { MiogramStudioModal } from './MiogramStudioModal';

type OwnProps = {
  currentUserId?: number;
};

export const MiogramStudioButton = ({ currentUserId }: OwnProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="Miogram Studio ໒꒱"
        style="position: fixed; bottom: 1.25rem; left: 1.25rem; z-index: 999; display: flex; align-items: center; justify-content: center; width: 2.75rem; height: 2.75rem; border-radius: 50%; background: linear-gradient(135deg, #FF69B4 0%, #5865F2 100%); border: none; box-shadow: 0 4px 15px rgba(88, 101, 242, 0.5); cursor: pointer; color: #FFFFFF; font-size: 1.25rem; transition: transform 0.2s ease;"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
      >
        ໒꒱
      </button>

      {isOpen && (
        <MiogramStudioModal
          isOpen={isOpen}
          currentUserId={currentUserId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default MiogramStudioButton;
