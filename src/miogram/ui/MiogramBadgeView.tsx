import { useMemo, useState } from '../../lib/teact/teact';
import { MiogramSupabaseBridge } from '../badge/MiogramSupabaseBridge';
import { MiogramBadgeCarousel } from './MiogramBadgeCarousel';

type OwnProps = {
  userId: number;
  className?: string;
};

export const MiogramBadgeView = ({ userId, className }: OwnProps) => {
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);

  const badgeRecord = useMemo(() => {
    return MiogramSupabaseBridge.getBadgeForUser(userId);
  }, [userId]);

  if (!badgeRecord || !badgeRecord.isActive) {
    return undefined;
  }

  const badge = badgeRecord.badgeType;

  return (
    <>
      <span
        className={className}
        onClick={(e) => {
          e.stopPropagation();
          setIsCarouselOpen(true);
        }}
        title={`${badgeRecord.title} — ${badgeRecord.obtainedReason}`}
        style={`cursor: pointer; display: inline-flex; align-items: center; justify-content: center; margin-inline-start: 0.35rem; font-size: 0.85rem; color: ${badge.primaryColor}; filter: drop-shadow(0 0 6px ${badge.glowColor}); transition: transform 0.2s ease; user-select: none;`}
      >
        {badge.icon}
      </span>

      {isCarouselOpen && (
        <MiogramBadgeCarousel
          isOpen={isCarouselOpen}
          currentBadgeId={badge.id}
          onClose={() => setIsCarouselOpen(false)}
        />
      )}
    </>
  );
};

export default MiogramBadgeView;
