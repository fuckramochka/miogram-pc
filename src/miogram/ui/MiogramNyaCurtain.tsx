import { useState, useCallback } from '../../lib/teact/teact';
import { MiogramVault, PinVerdict } from '../vault/MiogramVault';
import { MiogramLocale } from '../localizer/MiogramLocale';

type OwnProps = {
  isLocked: boolean;
  onUnlocked: (verdict: PinVerdict) => void;
};

export const MiogramNyaCurtain = ({ isLocked, onUnlocked }: OwnProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    const verdict = await MiogramVault.verifyPin(pin);
    if (verdict === PinVerdict.NONE) {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    } else {
      setPin('');
      onUnlocked(verdict);
    }
  }, [pin, onUnlocked]);

  if (!isLocked) return undefined;

  return (
    <div className="miogram-nya-curtain">
      <div className="nya-banner">໒꒱ (｡•ㅅ•｡) ໒꒱</div>
      <div className="nya-title">
        {MiogramLocale.get('Сховище заблоковано', 'Хранилище заблокировано', 'Vault Locked')}
      </div>
      <div className="nya-subtitle">
        {MiogramLocale.get(
          'Введіть PIN-код для розблокування або аварійний PIN',
          'Введите PIN-код для разблокировки или аварийный PIN',
          'Enter master PIN to unlock or duress PIN'
        )}
      </div>

      <form onSubmit={handleSubmit} style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
        <input
          type="password"
          maxLength={8}
          autoFocus
          className="nya-pin-input"
          value={pin}
          onChange={(e) => setPin((e.target as HTMLInputElement).value)}
          placeholder="••••"
          style={error ? 'border-color: #FF3B30 !important; box-shadow: 0 0 15px rgba(255, 59, 48, 0.6) !important;' : undefined}
        />
        {error && (
          <div style="color: #FF3B30; font-size: 0.875rem; font-weight: 500;">
            {MiogramLocale.get('Невірний PIN-код', 'Неверный PIN-код', 'Incorrect PIN')}
          </div>
        )}
      </form>
    </div>
  );
};

export default MiogramNyaCurtain;
