import { useState, useCallback } from '../../lib/teact/teact';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { CANONICAL_BADGES, MiogramBadgeType } from '../badge/MiogramBadgeType';
import { MiogramSupabaseBridge } from '../badge/MiogramSupabaseBridge';
import { MiogramLocale } from '../localizer/MiogramLocale';

type OwnProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const MiogramFounderGrantModal = ({ isOpen, onClose }: OwnProps) => {
  const [userId, setUserId] = useState('');
  const [pickedBadge, setPickedBadge] = useState('original');
  const [reason, setReason] = useState('Особливий внесок у розвиток спільноти Miogram');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleGrant = useCallback(async () => {
    const numId = Number(userId.trim());
    if (!numId) {
      setStatusMsg(MiogramLocale.get('Введіть коректний числовий ID', 'Введите корректный числовой ID', 'Enter valid numeric ID'));
      return;
    }

    setIsLoading(true);
    setStatusMsg('');
    const badge = CANONICAL_BADGES[pickedBadge] || CANONICAL_BADGES.original;
    const ok = await MiogramSupabaseBridge.grantBadgeByFounder(numId, badge.id, `Miogram ${badge.titleUk} ໒꒱`, reason);
    setIsLoading(false);

    if (ok) {
      setStatusMsg(MiogramLocale.get('✓ Відзнаку успішно надано!', '✓ Бейдж успешно выдан!', '✓ Badge successfully granted!'));
      setTimeout(() => {
        onClose();
        setStatusMsg('');
      }, 1200);
    } else {
      setStatusMsg(MiogramLocale.get('Помилка видачі. Перевірте мережу.', 'Ошибка выдачи. Проверьте сеть.', 'Grant failed. Check network.'));
    }
  }, [userId, pickedBadge, reason, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={MiogramLocale.get('Видати відзнаку (Founder Grant) ໒꒱', 'Выдать бейдж (Founder Grant) ໒꒱', 'Grant Badge (Founder Mode) ໒꒱')}
      hasCloseButton
    >
      <div style="display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem 1rem;">
        <label style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.875rem;">
          <span>{MiogramLocale.get('ID користувача (Telegram User ID)', 'ID пользователя (Telegram User ID)', 'Telegram User ID')}</span>
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId((e.target as HTMLInputElement).value)}
            placeholder="8011880648"
            style="padding: 0.6rem 0.8rem; border-radius: 0.5rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #fff;"
          />
        </label>

        <label style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.875rem;">
          <span>{MiogramLocale.get('Стиль відзнаки', 'Стиль бейджа', 'Badge Style')}</span>
          <select
            value={pickedBadge}
            onChange={(e) => setPickedBadge((e.target as HTMLSelectElement).value)}
            style="padding: 0.6rem 0.8rem; border-radius: 0.5rem; background: #232428; border: 1px solid rgba(255,255,255,0.2); color: #fff;"
          >
            {Object.values(CANONICAL_BADGES).map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} — {MiogramBadgeType.getTitle(b)}
              </option>
            ))}
          </select>
        </label>

        <label style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.875rem;">
          <span>{MiogramLocale.get('Причина видачі (Lore)', 'Причина выдачи (Lore)', 'Obtain Reason (Lore)')}</span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason((e.target as HTMLTextAreaElement).value)}
            style="padding: 0.6rem 0.8rem; border-radius: 0.5rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #fff; resize: vertical;"
          />
        </label>

        {statusMsg && (
          <div style="font-size: 0.875rem; text-align: center; color: var(--color-primary);">
            {statusMsg}
          </div>
        )}

        <Button
          isLoading={isLoading}
          onClick={handleGrant}
        >
          {MiogramLocale.get('Підтвердити видачу', 'Подтвердить выдачу', 'Confirm Grant')}
        </Button>
      </div>
    </Modal>
  );
};

export default MiogramFounderGrantModal;
