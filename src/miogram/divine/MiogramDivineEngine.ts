/**
 * MiogramDivineEngine: Global preset and aesthetic orchestration engine.
 * Ported 1:1 from app.miogram.bridge.divine.MiogramDivineEngine.java.
 *
 * Supports instant switching without app reload between:
 * - CLASSIC_TG (Ame-Chan / Classic Web Z)
 * - DISCORD_ULTRA (Discord Dark Rail + Guilds Column)
 * - IOS_GLASS (Apple Cupertino + Large Titles + Inset Cards)
 * - MINIMALIST (60dp compact rail + maximum screen focus)
 * - WINDOWS_XP (Luna Blue classic nostalgia)
 */

import { MioHook, MioHookPoint } from '../hooks/MioHook';
import { MiogramLocale } from '../localizer/MiogramLocale';

export enum MiogramPreset {
  CLASSIC_TG = 'CLASSIC_TG',
  DISCORD_ULTRA = 'DISCORD_ULTRA',
  IOS_GLASS = 'IOS_GLASS',
  MINIMALIST = 'MINIMALIST',
  WINDOWS_XP = 'WINDOWS_XP',
}

const STORAGE_KEY = 'current_divine_preset';

export class MiogramDivineEngine {
  private static cachedPreset: MiogramPreset | undefined;

  public static getCurrentPreset(): MiogramPreset {
    if (this.cachedPreset) return this.cachedPreset;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && Object.values(MiogramPreset).includes(stored as MiogramPreset)) {
        this.cachedPreset = stored as MiogramPreset;
        return this.cachedPreset;
      }
    } catch {
      // Storage unavailable
    }

    this.cachedPreset = MiogramPreset.CLASSIC_TG;
    return this.cachedPreset;
  }

  public static getPresetTitle(preset: MiogramPreset): string {
    switch (preset) {
      case MiogramPreset.DISCORD_ULTRA:
        return MiogramLocale.get('Discord Ultra (Dark Compact)', 'Discord Ultra (Dark Compact)', 'Discord Ultra (Dark Compact)');
      case MiogramPreset.IOS_GLASS:
        return MiogramLocale.get('iOS Glassmorphism (Apple Style)', 'iOS Glassmorphism (Apple Style)', 'iOS Glassmorphism (Apple Style)');
      case MiogramPreset.MINIMALIST:
        return MiogramLocale.get('Minimalist (Швидкість та фокус)', 'Minimalist (Скорость и фокус)', 'Minimalist (Speed & Focus)');
      case MiogramPreset.WINDOWS_XP:
        return MiogramLocale.get('Windows XP (Luna Blue)', 'Windows XP (Luna Blue)', 'Windows XP (Luna Blue)');
      case MiogramPreset.CLASSIC_TG:
      default:
        return MiogramLocale.get('Classic TG (Ame-Chan)', 'Classic TG (Ame-Chan)', 'Classic TG (Ame-Chan)');
    }
  }

  public static applyPreset(preset: MiogramPreset): void {
    this.cachedPreset = preset;
    try {
      localStorage.setItem(STORAGE_KEY, preset);
    } catch {
      // Ignore storage errors
    }

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-miogram-preset', preset);

      // Remove previous preset classes
      for (const p of Object.values(MiogramPreset)) {
        root.classList.remove(`miogram-preset-${p.toLowerCase()}`);
      }
      root.classList.add(`miogram-preset-${preset.toLowerCase()}`);
    }

    MioHook.dispatch(MioHookPoint.PRESET_CHANGED, preset);
  }

  public static isDiscordActive(): boolean {
    return this.getCurrentPreset() === MiogramPreset.DISCORD_ULTRA;
  }

  public static isIosActive(): boolean {
    return this.getCurrentPreset() === MiogramPreset.IOS_GLASS;
  }

  public static isMinimalistActive(): boolean {
    return this.getCurrentPreset() === MiogramPreset.MINIMALIST;
  }

  public static isWindowsXpActive(): boolean {
    return this.getCurrentPreset() === MiogramPreset.WINDOWS_XP;
  }

  public static init(): void {
    const current = this.getCurrentPreset();
    this.applyPreset(current);
  }
}

export default MiogramDivineEngine;
