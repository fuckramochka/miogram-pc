import { useState, useCallback } from '../../lib/teact/teact';
import Modal from '../../components/ui/Modal';
import { MiogramDivineEngine, MiogramPreset } from '../divine/MiogramDivineEngine';
import { MiogramLocale } from '../localizer/MiogramLocale';

type OwnProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const MiogramPresetSwitcher = ({ isOpen, onClose }: OwnProps) => {
  const [activePreset, setActivePreset] = useState<MiogramPreset>(MiogramDivineEngine.getCurrentPreset());

  const handleSelect = useCallback((preset: MiogramPreset) => {
    setActivePreset(preset);
    MiogramDivineEngine.applyPreset(preset);
  }, []);

  const presets = [
    {
      id: MiogramPreset.CLASSIC_TG,
      name: MiogramLocale.get('Classic TG (Ame-Chan)', 'Classic TG (Ame-Chan)', 'Classic TG (Ame-Chan)'),
      desc: MiogramLocale.get('Класичний вигляд Telegram Web Z з аніме-вайбом ໒꒱', 'Классический вид Telegram Web Z', 'Classic Web Z with subtle vibe'),
      badge: 'Default',
    },
    {
      id: MiogramPreset.DISCORD_ULTRA,
      name: MiogramLocale.get('Discord Ultra (Dark Compact)', 'Discord Ultra (Dark Compact)', 'Discord Ultra (Dark Compact)'),
      desc: MiogramLocale.get('Лівий 72dp рейл, анімовані сквиркли, індикатори-піли та Blurple акценти', 'Левый 72dp рейл, сквирклы и Discord стиль', '72dp rail, squircle morph, pill indicators & Blurple'),
      badge: 'Popular',
    },
    {
      id: MiogramPreset.IOS_GLASS,
      name: MiogramLocale.get('iOS Glassmorphism (Apple Style)', 'iOS Glassmorphism (Apple Style)', 'iOS Glassmorphism (Apple Style)'),
      desc: MiogramLocale.get('Токени iOS 1:1 (#007AFF, #F2F2F2E6), картки та розмиття фону', 'Токены iOS 1:1, карточки и размытие', '1:1 iOS tokens (#007AFF, #F2F2F2E6), inset cards'),
      badge: 'Cupertino',
    },
    {
      id: MiogramPreset.MINIMALIST,
      name: MiogramLocale.get('Minimalist (Швидкість та фокус)', 'Minimalist (Скорость и фокус)', 'Minimalist (Speed & Focus)'),
      desc: MiogramLocale.get('Компактний 60dp рейл для максимального простору та фокусу', 'Компактный 60dp рейл для фокуса', '60dp slim rail for maximum focus'),
      badge: 'Speed',
    },
    {
      id: MiogramPreset.WINDOWS_XP,
      name: MiogramLocale.get('Windows XP (Luna Blue)', 'Windows XP (Luna Blue)', 'Windows XP (Luna Blue)'),
      desc: MiogramLocale.get('Ностальгічний синій стиль із класичними градієнтами', 'Ностальгический синий стиль', 'Nostalgic Luna Blue palette'),
      badge: 'Retro',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={MiogramLocale.get('Miogram Divine Studio — Лейаути ໒꒱', 'Miogram Divine Studio — Лейауты ໒꒱', 'Miogram Divine Studio — Layouts ໒꒱')}
      hasCloseButton
    >
      <div style="display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem 1rem;">
        <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 0.5rem;">
          {MiogramLocale.get(
            'Перемикання пресетів інтерфейсу в реальному часі без перезавантаження програми:',
            'Переключение пресетов интерфейса в реальном времени без перезагрузки:',
            'Switch interface presets dynamically in real-time without app reload:'
          )}
        </div>

        {presets.map((p) => {
          const isSelected = activePreset === p.id;
          return (
            <div
              key={p.id}
              onClick={() => handleSelect(p.id)}
              style={`cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-radius: 0.75rem; border: 2px solid ${isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)'}; background: ${isSelected ? 'rgba(0,122,255,0.1)' : 'rgba(255,255,255,0.03)'}; transition: all 0.2s ease;`}
            >
              <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-weight: 700; font-size: 1rem; color: #fff;">{p.name}</span>
                  <span style="font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 0.35rem; background: rgba(255,255,255,0.1); color: var(--color-primary); font-weight: 600;">
                    {p.badge}
                  </span>
                </div>
                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.6);">
                  {p.desc}
                </div>
              </div>
              <div style="font-size: 1.25rem; color: var(--color-primary);">
                {isSelected ? '●' : '○'}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default MiogramPresetSwitcher;
