/**
 * MiogramAiService: High-performance Gemini AI service with multi-key rotation and fallback chain.
 * Ported 1:1 from app.miogram.bridge.ai.MiogramAiService.java.
 *
 * Models:
 * - DEFAULT_MODEL: 'gemini-2.5-flash'
 * - FALLBACK_MODEL: 'gemini-2.5-flash'
 * - PLUGIN_MODEL: 'gemini-3.8-flash' (Dedicated for Miogram Plugin Forge)
 *
 * Features:
 * - Round-robin key rotation across user-provided Gemini API keys
 * - Fallback chain on rate limits or API errors
 * - JSON Mode for structured extraction
 * - Summary, Rewrite, Translate, Keypoints
 * - Integration with MioHook.AI_TEXT_RESULT
 */

import { MioHook, MioHookPoint } from '../hooks/MioHook';

const AI_PREFS_KEY = 'miogram_ai_api_keys';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash';
export const PLUGIN_MODEL = 'gemini-3.8-flash';

export class MiogramAiService {
  private static keyCursor = 0;

  public static getApiKeys(): string[] {
    try {
      const stored = localStorage.getItem(AI_PREFS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      }
    } catch {
      // Storage unavailable
    }
    return [];
  }

  public static setApiKeys(keys: string[]): void {
    try {
      localStorage.setItem(AI_PREFS_KEY, JSON.stringify(keys.filter(Boolean)));
    } catch {
      // Ignore storage errors
    }
  }

  public static addApiKey(key: string): void {
    const clean = key.trim();
    if (!clean) return;
    const current = this.getApiKeys();
    if (!current.includes(clean)) {
      current.push(clean);
      this.setApiKeys(current);
    }
  }

  public static hasApiKey(): boolean {
    return this.getApiKeys().length > 0;
  }

  /**
   * Selects next API key in round-robin sequence
   */
  public static getNextApiKey(): string | undefined {
    const keys = this.getApiKeys();
    if (keys.length === 0) return undefined;
    const key = keys[this.keyCursor % keys.length];
    this.keyCursor = (this.keyCursor + 1) % keys.length;
    return key;
  }

  public static async generate(
    prompt: string,
    systemInstruction = '',
    model = DEFAULT_MODEL,
    jsonMode = false
  ): Promise<string> {
    const keys = this.getApiKeys();
    if (keys.length === 0) {
      throw new Error('No Gemini API keys configured. Add a key in Miogram AI settings.');
    }

    let lastError: Error | undefined;

    // Try keys with fallback
    for (let attempt = 0; attempt < keys.length; attempt++) {
      const apiKey = this.getNextApiKey()!;
      try {
        const text = await this.callGemini(prompt, systemInstruction, model, apiKey, jsonMode);
        // Hook dispatch to allow plugins to modify or inspect AI text
        const hookCarrier = { kind: 'generate', text };
        MioHook.dispatch(MioHookPoint.AI_TEXT_RESULT, hookCarrier);
        return hookCarrier.text;
      } catch (err: any) {
        lastError = err;
        console.warn(`[MiogramAiService] Attempt ${attempt + 1} with key failed:`, err.message);
        // If error might be model-specific, retry with fallback model
        if (model !== FALLBACK_MODEL) {
          try {
            const fallbackText = await this.callGemini(prompt, systemInstruction, FALLBACK_MODEL, apiKey, jsonMode);
            const hookCarrier = { kind: 'fallback', text: fallbackText };
            MioHook.dispatch(MioHookPoint.AI_TEXT_RESULT, hookCarrier);
            return hookCarrier.text;
          } catch {
            // Continue key loop
          }
        }
      }
    }

    throw lastError || new Error('All Gemini API keys failed.');
  }

  private static async callGemini(
    prompt: string,
    systemInstruction: string,
    model: string,
    apiKey: string,
    jsonMode: boolean
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body: any = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    if (jsonMode) {
      body.generationConfig = { responseMimeType: 'application/json' };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (!textPart) {
      throw new Error('Empty response from Gemini API');
    }

    return textPart;
  }

  // Pre-configured task helpers
  public static async summarize(text: string): Promise<string> {
    return this.generate(
      text,
      'Ти — Miogram AI. Створи чітке, лаконічне резюме (саммарі) наданого тексту українською мовою з ключовими тезами та висновками.'
    );
  }

  public static async rewrite(text: string, style = 'concise'): Promise<string> {
    const styles: Record<string, string> = {
      concise: 'зроби текст максимально лаконічним і чітким',
      formal: 'перепиши в офіційно-діловому стилі',
      friendly: 'перепиши дружнім, теплим тоном',
      anime: 'перепиши грайливим аніме-стилем з милими каомодзі ໒꒱',
    };
    const instruction = styles[style] || styles.concise;
    return this.generate(
      text,
      `Ти — Miogram AI. Перепиши наданий текст: ${instruction}. Збережи первинний зміст.`
    );
  }

  public static async translate(text: string, targetLanguage = 'uk'): Promise<string> {
    return this.generate(
      text,
      `Ти — професійний перекладач. Переклади наданий текст на мову: ${targetLanguage}. Перекладай природно і точно, без зайвих пояснень.`
    );
  }

  public static async extractKeypoints(text: string): Promise<string[]> {
    const prompt = `Витягни головні ключові пункти з наступного тексту у вигляді JSON масиву рядків ["пункт 1", "пункт 2", ...]:\n\n${text}`;
    const raw = await this.generate(prompt, 'Ти — аналітичний помічник.', DEFAULT_MODEL, true);
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
      if (Array.isArray(parsed.keypoints)) return parsed.keypoints.map(String);
    } catch {
      // Fallback splitting lines
    }
    return raw.split('\n').filter(Boolean);
  }

  public static async forgePlugin(prompt: string, language: 'rust' | 'go' = 'rust'): Promise<string> {
    const sysPrompt = `Ти — Miogram Plugin Forge Generator. Використовуй модель ${PLUGIN_MODEL}.
Генеруй повний, робочий код плагіна для Miogram на мові ${language === 'rust' ? 'Rust (WASM)' : 'Go'} з використанням ABI miogram_call, маніфесту та envelоpe MIOG.
Повертай виключно код плагіна без зайвих балачок.`;
    return this.generate(prompt, sysPrompt, PLUGIN_MODEL, false);
  }
}

export default MiogramAiService;
