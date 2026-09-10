import { useState, useCallback } from '../../lib/teact/teact';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { MiogramAiService } from '../ai/MiogramAiService';
import { MiogramLocale } from '../localizer/MiogramLocale';

type OwnProps = {
  isOpen: boolean;
  selectedText?: string;
  onClose: () => void;
  onInsertText?: (text: string) => void;
};

export const MiogramChatAiModal = ({
  isOpen,
  selectedText = '',
  onClose,
  onInsertText,
}: OwnProps) => {
  const [activeTab, setActiveTab] = useState<'write' | 'forge' | 'keys'>('write');
  const [inputPrompt, setInputPrompt] = useState(selectedText);
  const [resultText, setResultText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keysList, setKeysList] = useState<string[]>(MiogramAiService.getApiKeys());

  const handleAction = useCallback(async (action: 'summarize' | 'rewrite_concise' | 'rewrite_formal' | 'rewrite_anime' | 'forge') => {
    if (!inputPrompt) return;
    setIsLoading(true);
    try {
      let res = '';
      if (action === 'summarize') {
        res = await MiogramAiService.summarize(inputPrompt);
      } else if (action === 'rewrite_concise') {
        res = await MiogramAiService.rewrite(inputPrompt, 'concise');
      } else if (action === 'rewrite_formal') {
        res = await MiogramAiService.rewrite(inputPrompt, 'formal');
      } else if (action === 'rewrite_anime') {
        res = await MiogramAiService.rewrite(inputPrompt, 'anime');
      } else if (action === 'forge') {
        res = await MiogramAiService.forgePlugin(inputPrompt, 'rust');
      }
      setResultText(res);
    } catch (err: any) {
      setResultText(`Помилка: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [inputPrompt]);

  const handleAddKey = useCallback(() => {
    if (apiKeyInput.trim()) {
      MiogramAiService.addApiKey(apiKeyInput.trim());
      setKeysList(MiogramAiService.getApiKeys());
      setApiKeyInput('');
    }
  }, [apiKeyInput]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={MiogramLocale.get('Miogram AI Studio ໒꒱', 'Miogram AI Studio ໒꒱', 'Miogram AI Studio ໒꒱')}
      hasCloseButton
    >
      <div style="display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem 1rem;">
        {/* Subtabs */}
        <div style="display: flex; gap: 0.5rem;">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            style={`flex: 1; padding: 0.5rem; border-radius: 0.5rem; border: none; font-weight: 600; cursor: pointer; background: ${activeTab === 'write' ? '#007AFF' : 'rgba(255,255,255,0.08)'}; color: #fff;`}
          >
            {MiogramLocale.get('Помічник тексту', 'Помощник текста', 'Text Assistant')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('forge')}
            style={`flex: 1; padding: 0.5rem; border-radius: 0.5rem; border: none; font-weight: 600; cursor: pointer; background: ${activeTab === 'forge' ? '#007AFF' : 'rgba(255,255,255,0.08)'}; color: #fff;`}
          >
            {MiogramLocale.get('Plugin Forge', 'Plugin Forge', 'Plugin Forge')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            style={`flex: 1; padding: 0.5rem; border-radius: 0.5rem; border: none; font-weight: 600; cursor: pointer; background: ${activeTab === 'keys' ? '#007AFF' : 'rgba(255,255,255,0.08)'}; color: #fff;`}
          >
            {MiogramLocale.get('API Ключі', 'API Ключи', 'API Keys')}
          </button>
        </div>

        {/* WRITE TAB */}
        {activeTab === 'write' && (
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <textarea
              rows={4}
              value={inputPrompt}
              onChange={(e) => setInputPrompt((e.target as HTMLTextAreaElement).value)}
              placeholder={MiogramLocale.get('Введіть або виберіть текст для обробки...', 'Введите или выберите текст для обработки...', 'Enter or select text...')}
              style="padding: 0.75rem; border-radius: 0.5rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #fff; resize: vertical;"
            />

            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              <button
                type="button"
                onClick={() => handleAction('summarize')}
                style="padding: 0.4rem 0.8rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: #fff; cursor: pointer;"
              >
                📝 Саммарі
              </button>
              <button
                type="button"
                onClick={() => handleAction('rewrite_concise')}
                style="padding: 0.4rem 0.8rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: #fff; cursor: pointer;"
              >
                ✂️ Лаконічно
              </button>
              <button
                type="button"
                onClick={() => handleAction('rewrite_formal')}
                style="padding: 0.4rem 0.8rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: #fff; cursor: pointer;"
              >
                👔 Офіційно
              </button>
              <button
                type="button"
                onClick={() => handleAction('rewrite_anime')}
                style="padding: 0.4rem 0.8rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: #fff; cursor: pointer;"
              >
                ໒꒱ Аніме-вайб
              </button>
            </div>
          </div>
        )}

        {/* FORGE TAB */}
        {activeTab === 'forge' && (
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="font-size: 0.875rem; color: rgba(255,255,255,0.7);">
              Генерація коду плагінів за допомогою моделі <b>gemini-3.8-flash</b> з ABI для <code>MioHook</code>.
            </div>
            <textarea
              rows={3}
              value={inputPrompt}
              onChange={(e) => setInputPrompt((e.target as HTMLTextAreaElement).value)}
              placeholder="Опишіть плагін (наприклад: додає лічильник слів або фільтрує спам)..."
              style="padding: 0.75rem; border-radius: 0.5rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #fff; resize: vertical;"
            />
            <Button onClick={() => handleAction('forge')}>
              ⚡ Створити плагін (Forge)
            </Button>
          </div>
        )}

        {/* KEYS TAB */}
        {activeTab === 'keys' && (
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; gap: 0.5rem;">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput((e.target as HTMLInputElement).value)}
                placeholder="AIzaSy..."
                style="flex: 1; padding: 0.6rem 0.8rem; border-radius: 0.5rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #fff;"
              />
              <Button onClick={handleAddKey}>Додати</Button>
            </div>
            <div style="font-size: 0.85rem; color: rgba(255,255,255,0.6);">
              Збережено ключів: {keysList.length}. Сервіс виконує ротацію запитів між ключами.
            </div>
          </div>
        )}

        {/* RESULT AREA */}
        {(isLoading || resultText) && (
          <div style="position: relative; padding: 1rem; border-radius: 0.5rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); max-height: 14rem; overflow-y: auto;">
            {isLoading ? (
              <div style="text-align: center; color: rgba(255,255,255,0.6);">
                Генерація відповіді...
              </div>
            ) : (
              <div>
                <pre style="white-space: pre-wrap; font-family: inherit; font-size: 0.9rem; margin: 0;">
                  {resultText}
                </pre>
                {onInsertText && (
                  <div style="margin-top: 0.75rem; display: flex; justify-content: flex-end;">
                    <Button
                      size="smaller"
                      onClick={() => {
                        onInsertText(resultText);
                        onClose();
                      }}
                    >
                      Вставити в чат
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MiogramChatAiModal;
