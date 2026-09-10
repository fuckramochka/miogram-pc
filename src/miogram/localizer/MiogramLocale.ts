/**
 * MiogramLocale: Trilingual localization helper for Miogram components.
 * Ported 1:1 from app.miogram.bridge.MiogramLocale.java.
 * Automatically adapts to active client language (Ukrainian, Russian, English/Default).
 */

export class MiogramLocale {
  private static cachedLang: string | undefined;

  public static getCurrentLanguage(): string {
    if (this.cachedLang) return this.cachedLang;

    try {
      const stored = localStorage.getItem('tt-lang-code') || localStorage.getItem('i18n_lang');
      if (stored) {
        this.cachedLang = stored.toLowerCase();
        return this.cachedLang;
      }
    } catch {
      // Ignore storage errors
    }

    if (typeof navigator !== 'undefined' && navigator.language) {
      this.cachedLang = navigator.language.toLowerCase();
      return this.cachedLang;
    }

    return 'uk';
  }

  public static isUkrainian(): boolean {
    const lang = this.getCurrentLanguage();
    return lang.startsWith('uk') || lang.startsWith('ua');
  }

  public static get(uk: string, ru: string, en: string): string {
    const lang = this.getCurrentLanguage();
    if (lang.startsWith('uk') || lang.startsWith('ua')) {
      return uk;
    }
    if (lang.startsWith('ru') || lang.startsWith('be') || lang.startsWith('kk')) {
      return ru;
    }
    return en;
  }

  public static format(uk: string, ru: string, en: string, ...args: Array<string | number>): string {
    let template = this.get(uk, ru, en);
    args.forEach((arg, index) => {
      template = template.replace(new RegExp(`\\{${index}\\}|%s`, 'g'), String(arg));
    });
    return template;
  }

  public static setLanguageOverride(langCode: string | undefined): void {
    this.cachedLang = langCode ? langCode.toLowerCase() : undefined;
  }
}

export default MiogramLocale;
