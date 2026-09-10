/**
 * MiogramVault: Zero-Knowledge Secure Vault & Duress PIN Engine.
 * Ported 1:1 from app.miogram.bridge.vault.MiogramDoubleBottomManager.java.
 *
 * Capabilities:
 * - Duress PIN with Decoy mode
 * - Salted SHA-256 hash storage: v1$<saltHex>$<hashHex>
 * - Constant-time timing-attack-safe comparison
 * - Nya-curtain (ня-шторка) full privacy screen when locked
 * - Dialog visibility hook filtering for secret chats in duress mode
 */

import { MioHook, MioHookPoint } from '../hooks/MioHook';

const HASH_PREFIX = 'v1$';
const KEY_REAL_PIN_HASH = 'miogram_vault_pin_real';
const KEY_DURESS_PIN_HASH = 'miogram_vault_pin_duress';
const KEY_DURESS_HIDDEN_DIALOGS = 'miogram_vault_hidden_dialogs';

export enum PinVerdict {
  NONE = 'NONE',
  REAL = 'REAL',
  DURESS = 'DURESS',
}

export class MiogramVault {
  private static isLockedState = false;
  private static isDecoyModeState = false;
  private static hiddenDialogIds: Set<number> = new Set();
  private static isInitialized = false;

  public static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Load hidden dialogs list
    try {
      const stored = localStorage.getItem(KEY_DURESS_HIDDEN_DIALOGS);
      if (stored) {
        const arr = JSON.parse(stored) as number[];
        this.hiddenDialogIds = new Set(arr);
      }
    } catch {
      // Storage unavailable
    }

    // Register hook for dialog visibility
    MioHook.register<number>(
      MioHookPoint.DIALOG_VISIBILITY,
      'miogram_vault',
      (dialogId: number) => {
        // In Decoy mode, hide secret dialogs
        if (this.isDecoyModeState && this.hiddenDialogIds.has(dialogId)) {
          return false;
        }
        return true;
      },
      100
    );

    // If a PIN is configured, lock on startup
    if (this.hasPinConfigured()) {
      this.isLockedState = true;
    }
  }

  public static hasPinConfigured(): boolean {
    try {
      return Boolean(localStorage.getItem(KEY_REAL_PIN_HASH));
    } catch {
      return false;
    }
  }

  public static isLocked(): boolean {
    return this.isLockedState;
  }

  public static isDecoyMode(): boolean {
    return this.isDecoyModeState;
  }

  public static setLocked(locked: boolean): void {
    this.isLockedState = locked;
  }

  public static lock(): void {
    this.isLockedState = true;
    this.isDecoyModeState = false;
  }

  public static async setRealPin(pin: string): Promise<void> {
    const hash = await this.computeHash(pin);
    localStorage.setItem(KEY_REAL_PIN_HASH, hash);
  }

  public static async setDuressPin(pin: string): Promise<void> {
    if (!pin) {
      localStorage.removeItem(KEY_DURESS_PIN_HASH);
      return;
    }
    const hash = await this.computeHash(pin);
    localStorage.setItem(KEY_DURESS_PIN_HASH, hash);
  }

  public static setHiddenDialogs(dialogIds: number[]): void {
    this.hiddenDialogIds = new Set(dialogIds);
    localStorage.setItem(KEY_DURESS_HIDDEN_DIALOGS, JSON.stringify(dialogIds));
  }

  public static getHiddenDialogs(): number[] {
    return Array.from(this.hiddenDialogIds);
  }

  public static async verifyPin(pin: string): Promise<PinVerdict> {
    if (!pin) return PinVerdict.NONE;

    const realHash = localStorage.getItem(KEY_REAL_PIN_HASH);
    const duressHash = localStorage.getItem(KEY_DURESS_PIN_HASH);

    if (realHash && (await this.matchesHash(pin, realHash))) {
      this.isLockedState = false;
      this.isDecoyModeState = false;
      return PinVerdict.REAL;
    }

    if (duressHash && (await this.matchesHash(pin, duressHash))) {
      this.isLockedState = false;
      this.isDecoyModeState = true; // Decoy / duress mode activated!
      return PinVerdict.DURESS;
    }

    return PinVerdict.NONE;
  }

  /**
   * Generates v1$<saltHex>$<sha256Hex> format
   */
  private static async computeHash(pin: string): Promise<string> {
    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    const saltHex = Array.from(saltBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const encoder = new TextEncoder();
    const data = encoder.encode(`${saltHex}\n${pin.trim()}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return `${HASH_PREFIX}${saltHex}$${hashHex}`;
  }

  private static async matchesHash(pin: string, stored: string): Promise<boolean> {
    if (!stored.startsWith(HASH_PREFIX)) {
      // Legacy plaintext migration
      return this.constantTimeCompare(pin, stored);
    }

    const parts = stored.split('$');
    if (parts.length !== 3) return false;

    const saltHex = parts[1];
    const expectedHashHex = parts[2];

    const encoder = new TextEncoder();
    const data = encoder.encode(`${saltHex}\n${pin.trim()}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const actualHashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return this.constantTimeCompare(expectedHashHex, actualHashHex);
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}

export default MiogramVault;
