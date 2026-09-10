import { useState, useCallback } from '../../lib/teact/teact';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { CANONICAL_BADGES, MiogramBadgeType, type BadgeDefinition } from '../badge/MiogramBadgeType';
import { MiogramLocale } from '../localizer/MiogramLocale';

type OwnProps = {
  isOpen: boolean;
  currentBadgeId?: string;
  onClose: () => void;
  onSelectBadge?: (badgeId: string) => void;
};

export const MiogramBadgeCarousel = ({
  isOpen,
  currentBadgeId = 'original',
  onClose,
  onSelectBadge,
}: OwnProps) => {
  const badges = Object.values(CANONICAL_BADGES);
  const initialIndex = Math.max(0, badges.findIndex((b) => b.id === currentBadgeId));
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const activeBadge = badges[currentIndex] || badges[0];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : badges.length - 1));
  }, [badges.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < badges.length - 1 ? prev + 1 : 0));
  }, [badges.length]);

  const handleApply = useCallback(() => {
    onSelectBadge?.(activeBadge.id);
    onClose();
  }, [activeBadge.id, onSelectBadge, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={MiogramLocale.get('Колекція відзнак Miogram ໒꒱', 'Коллекция бейджей Miogram ໒꒱', 'Miogram Badge Collection ໒꒱')}
      hasCloseButton
    >
      <div style="display: flex; flex-direction: column; align-items: center; padding: 1.5rem 1rem; text-align: center;">
        {/* Carousel Viewport */}
        <div style="position: relative; width: 100%; display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
          <button
            type="button"
            onClick={handlePrev}
            style="background: rgba(255, 255, 255, 0.1); border: none; border-radius: 50%; width: 2.5rem; height: 2.5rem; color: #fff; font-size: 1.25rem; cursor: pointer;"
          >
            ‹
          </button>

          {/* Badge Display Box */}
          <div
            style={`display: flex; flex-direction: column; align-items: center; justify-content: center; width: 10rem; height: 10rem; border-radius: 1.5rem; background: radial-gradient(circle, ${activeBadge.secondaryColor}22 0%, #1a1a24 100%); border: 2px solid ${activeBadge.primaryColor}; box-shadow: 0 0 25px ${activeBadge.glowColor}; transition: all 0.3s ease;`}
          >
            <div style={`font-size: 3.5rem; filter: drop-shadow(0 0 10px ${activeBadge.primaryColor});`}>
              {activeBadge.icon}
            </div>
            <div style={`font-weight: 700; font-size: 1.1rem; color: ${activeBadge.primaryColor}; margin-top: 0.5rem;`}>
              {activeBadge.code}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            style="background: rgba(255, 255, 255, 0.1); border: none; border-radius: 50%; width: 2.5rem; height: 2.5rem; color: #fff; font-size: 1.25rem; cursor: pointer;"
          >
            ›
          </button>
        </div>

        {/* Badge Lore & Details */}
        <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">
          {MiogramBadgeType.getTitle(activeBadge)}
        </h3>
        <p style="font-size: 0.875rem; color: var(--color-text-secondary); max-width: 20rem; margin-bottom: 1.5rem;">
          {MiogramLocale.get(
            'Офіційна верифікована відзнака екосистеми Miogram із синхронізацією у Supabase.',
            'Официальный верифицированный бейдж экосистемы Miogram с синхронизацией в Supabase.',
            'Official verified badge of the Miogram ecosystem with Supabase cloud sync.'
          )}
        </p>

        {/* Action Button */}
        <Button
          size="smaller"
          ripple
          onClick={handleApply}
        >
          {MiogramLocale.get('Обрати стиль', 'Выбрать стиль', 'Select Style')}
        </Button>
      </div>
    </Modal>
  );
};

export default MiogramBadgeCarousel;
