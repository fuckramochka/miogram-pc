import { useState, useEffect, useRef, useCallback } from '../../lib/teact/teact';
import Modal from '../../components/ui/Modal';
import { LrcSong } from '../lyrics/MiogramLrcModel';
import { MiogramLyricsEngine } from '../lyrics/MiogramLyricsEngine';
import { MiogramLocale } from '../localizer/MiogramLocale';

type PlayerTab = 'lyrics' | 'cover' | 'queue';

type OwnProps = {
  isOpen: boolean;
  title: string;
  artist: string;
  coverUrl?: string;
  duration: number; // in seconds
  currentTime: number; // in seconds
  isPlaying: boolean;
  onClose: () => void;
  onSeek: (timeSec: number) => void;
  onTogglePlay: () => void;
};

export const MiogramModernPlayerModal = ({
  isOpen,
  title,
  artist,
  coverUrl,
  duration,
  currentTime,
  isPlaying,
  onClose,
  onSeek,
  onTogglePlay,
}: OwnProps) => {
  const [activeTab, setActiveTab] = useState<PlayerTab>('lyrics');
  const [song, setSong] = useState<LrcSong | undefined>();
  const [showTranslation, setShowTranslation] = useState(true);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>();

  useEffect(() => {
    if (!isOpen || !title) return;
    setIsLoadingLyrics(true);
    MiogramLyricsEngine.fetchLyrics(title, artist, duration).then((res) => {
      setSong(res);
      setIsLoadingLyrics(false);
    });
  }, [isOpen, title, artist, duration]);

  const currentMs = Math.round(currentTime * 1000);
  const activeLineIndex = song ? song.findLineIndex(currentMs) : -1;

  // Auto-scroll lyrics into view
  useEffect(() => {
    if (activeTab !== 'lyrics' || activeLineIndex < 0 || !lyricsContainerRef.current) return;
    const activeEl = lyricsContainerRef.current.children[activeLineIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeTab, activeLineIndex]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleLineClick = useCallback((timeMs: number) => {
    onSeek(timeMs / 1000);
  }, [onSeek]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hasCloseButton
      className="miogram-modern-player-modal"
    >
      <div style="display: flex; flex-direction: column; width: 100%; min-height: 32rem; max-height: 85vh; padding: 1rem; position: relative;">
        {/* Dynamic Blurred Backdrop */}
        {coverUrl && (
          <div
            style={`position: absolute; inset: 0; background-image: url('${coverUrl}'); background-size: cover; background-position: center; filter: blur(40px) brightness(0.35); z-index: 0; pointer-events: none; border-radius: 1rem;`}
          />
        )}

        {/* Top Tab Bar: Lyrics | Cover | Queue */}
        <div style="position: relative; z-index: 1; display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1rem;">
          <button
            type="button"
            onClick={() => setActiveTab('lyrics')}
            style={`padding: 0.4rem 1rem; border-radius: 1rem; border: none; font-weight: 600; cursor: pointer; background: ${activeTab === 'lyrics' ? '#007AFF' : 'rgba(255,255,255,0.1)'}; color: #fff;`}
          >
            {MiogramLocale.get('Лірика', 'Лирика', 'Lyrics')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cover')}
            style={`padding: 0.4rem 1rem; border-radius: 1rem; border: none; font-weight: 600; cursor: pointer; background: ${activeTab === 'cover' ? '#007AFF' : 'rgba(255,255,255,0.1)'}; color: #fff;`}
          >
            {MiogramLocale.get('Обкладинка', 'Обложка', 'Cover')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            style={`padding: 0.4rem 1rem; border-radius: 1rem; border: none; font-weight: 600; cursor: pointer; background: ${activeTab === 'queue' ? '#007AFF' : 'rgba(255,255,255,0.1)'}; color: #fff;`}
          >
            {MiogramLocale.get('Черга', 'Очередь', 'Queue')}
          </button>
        </div>

        {/* Middle Content Pane */}
        <div style="position: relative; z-index: 1; flex: 1; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          {/* TAB 1: LYRICS */}
          {activeTab === 'lyrics' && (
            <div
              ref={lyricsContainerRef}
              style="width: 100%; height: 20rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; padding: 2rem 1rem; mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%); text-align: center;"
            >
              {isLoadingLyrics ? (
                <div style="margin: auto; color: rgba(255,255,255,0.6);">
                  {MiogramLocale.get('Шукаємо текст...', 'Ищем текст...', 'Searching lyrics...')}
                </div>
              ) : song && song.lines.length > 0 ? (
                song.lines.map((line, idx) => {
                  const isActive = idx === activeLineIndex;
                  return (
                    <div
                      key={`${line.timeMs}_${idx}`}
                      onClick={() => handleLineClick(line.timeMs)}
                      style={`cursor: pointer; transition: all 0.25s ease; font-size: ${isActive ? '1.35rem' : '1.05rem'}; font-weight: ${isActive ? '700' : '400'}; color: ${isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)'}; transform: ${isActive ? 'scale(1.05)' : 'scale(1)'}; filter: ${isActive ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none'};`}
                    >
                      <div>{line.text}</div>
                      {showTranslation && line.translation && (
                        <div style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.25rem;">
                          {line.translation}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : song?.plainLyrics ? (
                <div style="white-space: pre-wrap; font-size: 1rem; line-height: 1.6; color: rgba(255,255,255,0.8);">
                  {song.plainLyrics}
                </div>
              ) : (
                <div style="margin: auto; color: rgba(255,255,255,0.5);">
                  {MiogramLocale.get('Текст пісні не знайдено', 'Текст песни не найден', 'No lyrics found')}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COVER */}
          {activeTab === 'cover' && (
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={title}
                  style="width: 16rem; height: 16rem; border-radius: 1.25rem; object-fit: cover; box-shadow: 0 15px 35px rgba(0,0,0,0.5);"
                />
              ) : (
                <div style="width: 16rem; height: 16rem; border-radius: 1.25rem; background: #232428; display: flex; align-items: center; justify-content: center; font-size: 4rem;">
                  🎵
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUEUE */}
          {activeTab === 'queue' && (
            <div style="width: 100%; height: 20rem; overflow-y: auto; padding: 1rem; color: rgba(255,255,255,0.8);">
              <div style="font-weight: 600; margin-bottom: 0.5rem;">
                {MiogramLocale.get('Зараз грає:', 'Сейчас играет:', 'Now playing:')}
              </div>
              <div style="padding: 0.75rem; border-radius: 0.5rem; background: rgba(255,255,255,0.08);">
                <div style="font-weight: 600;">{title}</div>
                <div style="font-size: 0.85rem; opacity: 0.7;">{artist}</div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Audio Controller */}
        <div style="position: relative; z-index: 1; width: 100%; margin-top: 1rem;">
          <div style="text-align: center; margin-bottom: 0.5rem;">
            <div style="font-weight: 700; font-size: 1.15rem; color: #fff;">{title}</div>
            <div style="font-size: 0.875rem; color: rgba(255,255,255,0.6);">{artist}</div>
          </div>

          {/* Progress Bar */}
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 0.75rem; opacity: 0.6; min-width: 2.5rem; text-align: right;">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onSeek(Number((e.target as HTMLInputElement).value))}
              style="flex: 1; accent-color: #007AFF; cursor: pointer;"
            />
            <span style="font-size: 0.75rem; opacity: 0.6; min-width: 2.5rem;">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls */}
          <div style="display: flex; justify-content: center; align-items: center; gap: 1.5rem; margin-top: 0.5rem;">
            <button
              type="button"
              onClick={onTogglePlay}
              style="background: #007AFF; border: none; border-radius: 50%; width: 3.25rem; height: 3.25rem; color: #fff; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 15px rgba(0,122,255,0.4);"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MiogramModernPlayerModal;
