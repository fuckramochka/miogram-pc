import { useState, useCallback } from '../../lib/teact/teact';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { MiogramDivineEngine, MiogramPreset } from '../divine/MiogramDivineEngine';
import { MiogramVault, PinVerdict } from '../vault/MiogramVault';
import { MiogramSupabaseBridge, FOUNDER_USER_ID } from '../badge/MiogramSupabaseBridge';
import { MiogramPerfOptimizer } from '../perf/MiogramPerfOptimizer';
import { MiogramLocale } from '../localizer/MiogramLocale';
import { MioHook } from '../hooks/MioHook';

import MiogramPresetSwitcher from './MiogramPresetSwitcher';
import MiogramBadgeCarousel from './MiogramBadgeCarousel';
import MiogramFounderGrantModal from './MiogramFounderGrantModal';
import MiogramModernPlayerModal from './MiogramModernPlayerModal';
import MiogramChatAiModal from './MiogramChatAiModal';
import MiogramKanbanModal from './MiogramKanbanModal';

type OwnProps = {
  isOpen: boolean;
  currentUserId?: number;
  onClose: () => void;
};

export const MiogramStudioModal = ({
  isOpen,
  currentUserId,
  onClose,
}: OwnProps) => {
  const [subModal, setSubModal] = useState<string | undefined>();
  const [realPinInput, setRealPinInput] = useState('');
  const [duressPinInput, setDuressPinInput] = useState('');
  const [vaultMsg, setVaultMsg] = useState('');

  const isFounder = currentUserId === FOUNDER_USER_ID;

  const handleSavePins = useCallback(async () => {
    if (realPinInput.trim()) {
      await MiogramVault.setRealPin(realPinInput.trim());
    }
    if (duressPinInput.trim()) {
      await MiogramVault.setDuressPin(duressPinInput.trim());
    }
    setVaultMsg(MiogramLocale.get('✓ PIN-коди збережено', '✓ PIN-коды сохранены', '✓ PINs saved'));
    setTimeout(() => setVaultMsg(''), 2000);
  }, [realPinInput, duressPinInput]);

  return (
    <>
      <Modal
        isOpen={isOpen && !subModal}
        onClose={onClose}
        title={MiogramLocale.get('Miogram Hub & Workspace ໒꒱', 'Miogram Hub & Workspace ໒꒱', 'Miogram Hub & Workspace ໒꒱')}
        hasCloseButton
      >
        <div style="display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem 1rem; max-height: 80vh; overflow-y: auto;">
          {/* Subsystem Grid */}
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
            {/* 1. Divine Layouts */}
            <div
              onClick={() => setSubModal('presets')}
              style="cursor: pointer; padding: 1rem; border-radius: 0.75rem; background: rgba(88, 101, 242, 0.12); border: 1px solid rgba(88, 101, 242, 0.3); transition: all 0.2s ease;"
            >
              <div style="font-size: 1.5rem; margin-bottom: 0.35rem;">🎨</div>
              <div style="font-weight: 700; color: #fff;">
                {MiogramLocale.get('Лейаути (Divine)', 'Лейауты (Divine)', 'Layouts (Divine)')}
              </div>
              <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-top: 0.25rem;">
                Discord 72dp, iOS Glass, Minimalist
              </div>
            </div>

            {/* 2. Badges */}
            <div
              onClick={() => setSubModal('badges')}
              style="cursor: pointer; padding: 1rem; border-radius: 0.75rem; background: rgba(255, 105, 180, 0.12); border: 1px solid rgba(255, 105, 180, 0.3); transition: all 0.2s ease;"
            >
              <div style="font-size: 1.5rem; margin-bottom: 0.35rem;">໒꒱</div>
              <div style="font-weight: 700; color: #fff;">
                {MiogramLocale.get('Відзнаки (Supabase)', 'Бейджи (Supabase)', 'Badges (Supabase)')}
              </div>
              <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-top: 0.25rem;">
                10 стилів, хмарна синхронізація
              </div>
            </div>

            {/* 3. AI Studio */}
            <div
              onClick={() => setSubModal('ai')}
              style="cursor: pointer; padding: 1rem; border-radius: 0.75rem; background: rgba(0, 210, 255, 0.12); border: 1px solid rgba(0, 210, 255, 0.3); transition: all 0.2s ease;"
            >
              <div style="font-size: 1.5rem; margin-bottom: 0.35rem;">🤖</div>
              <div style="font-weight: 700; color: #fff;">
                {MiogramLocale.get('Miogram AI', 'Miogram AI', 'Miogram AI')}
              </div>
              <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-top: 0.25rem;">
                Gemini ключі, саммарі, Plugin Forge
              </div>
            </div>

            {/* 4. Kanban */}
            <div
              onClick={() => setSubModal('kanban')}
              style="cursor: pointer; padding: 1rem; border-radius: 0.75rem; background: rgba(52, 199, 89, 0.12); border: 1px solid rgba(52, 199, 89, 0.3); transition: all 0.2s ease;"
            >
              <div style="font-size: 1.5rem; margin-bottom: 0.35rem;">📊</div>
              <div style="font-weight: 700; color: #fff;">
                {MiogramLocale.get('Канбан-дошка', 'Канбан-доска', 'Kanban Board')}
              </div>
              <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-top: 0.25rem;">
                4 колонки завдань і збережених чатів
              </div>
            </div>

            {/* 5. Modern Player */}
            <div
              onClick={() => setSubModal('player')}
              style="cursor: pointer; padding: 1rem; border-radius: 0.75rem; background: rgba(255, 45, 85, 0.12); border: 1px solid rgba(255, 45, 85, 0.3); transition: all 0.2s ease;"
            >
              <div style="font-size: 1.5rem; margin-bottom: 0.35rem;">🎵</div>
              <div style="font-weight: 700; color: #fff;">
                {MiogramLocale.get('Плеєр та лірика', 'Плеер и лирика', 'Player & Lyrics')}
              </div>
              <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-top: 0.25rem;">
                LRC караоке, обкладинка, пошук
              </div>
            </div>

            {/* 6. Founder Grant (Only if founder) */}
            {isFounder && (
              <div
                onClick={() => setSubModal('founder_grant')}
                style="cursor: pointer; padding: 1rem; border-radius: 0.75rem; background: rgba(255, 215, 0, 0.12); border: 1px solid rgba(255, 215, 0, 0.4); transition: all 0.2s ease;"
              >
                <div style="font-size: 1.5rem; margin-bottom: 0.35rem;">👑</div>
                <div style="font-weight: 700; color: #FFD700;">
                  Founder Grant
                </div>
                <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-top: 0.25rem;">
                  Видача відзнак користувачам
                </div>
              </div>
            )}
          </div>

          {/* Quick Lock & Duress PIN Manager */}
          <div style="margin-top: 0.5rem; padding: 1rem; border-radius: 0.75rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="font-weight: 700; font-size: 0.95rem; color: #fff;">
              🔒 {MiogramLocale.get('Безпека (Vault & Duress PIN)', 'Безопасность (Vault & Duress PIN)', 'Security (Vault & Duress PIN)')}
            </div>

            <div style="display: flex; gap: 0.5rem;">
              <input
                type="password"
                maxLength={8}
                value={realPinInput}
                onChange={(e) => setRealPinInput((e.target as HTMLInputElement).value)}
                placeholder="Справжній PIN (v1$salt)"
                style="flex: 1; padding: 0.5rem 0.7rem; border-radius: 0.5rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 0.85rem;"
              />
              <input
                type="password"
                maxLength={8}
                value={duressPinInput}
                onChange={(e) => setDuressPinInput((e.target as HTMLInputElement).value)}
                placeholder="Duress PIN (Decoy)"
                style="flex: 1; padding: 0.5rem 0.7rem; border-radius: 0.5rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 0.85rem;"
              />
            </div>

            {vaultMsg && (
              <div style="font-size: 0.8rem; color: var(--color-primary); text-align: center;">
                {vaultMsg}
              </div>
            )}

            <div style="display: flex; gap: 0.5rem;">
              <Button size="smaller" onClick={handleSavePins} style="flex: 1;">
                Зберегти PIN
              </Button>
              <Button
                size="smaller"
                color="danger"
                onClick={() => {
                  MiogramVault.lock();
                  onClose();
                }}
                style="flex: 1;"
              >
                Заблокувати зараз (Ня-шторка)
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Submodals */}
      {subModal === 'presets' && (
        <MiogramPresetSwitcher
          isOpen={true}
          onClose={() => setSubModal(undefined)}
        />
      )}

      {subModal === 'badges' && (
        <MiogramBadgeCarousel
          isOpen={true}
          onClose={() => setSubModal(undefined)}
        />
      )}

      {subModal === 'founder_grant' && (
        <MiogramFounderGrantModal
          isOpen={true}
          onClose={() => setSubModal(undefined)}
        />
      )}

      {subModal === 'ai' && (
        <MiogramChatAiModal
          isOpen={true}
          onClose={() => setSubModal(undefined)}
        />
      )}

      {subModal === 'kanban' && (
        <MiogramKanbanModal
          isOpen={true}
          onClose={() => setSubModal(undefined)}
        />
      )}

      {subModal === 'player' && (
        <MiogramModernPlayerModal
          isOpen={true}
          title="Demo Track"
          artist="Miogram Sound"
          duration={180}
          currentTime={30}
          isPlaying={false}
          onClose={() => setSubModal(undefined)}
          onSeek={() => {}}
          onTogglePlay={() => {}}
        />
      )}
    </>
  );
};

export default MiogramStudioModal;
