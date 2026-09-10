/**
 * MiogramCloudVaultEngine: Core engine for Miogram Encrypted Cloud Drive.
 * Ported 1:1 from app.miogram.bridge.cloudvault.MiogramCloudVaultEngine.java.
 *
 * Capabilities:
 * - Dedicated Forum Supergroup (topics represent virtual folders)
 * - AES-256-GCM client-side encryption/decryption with WebCrypto
 * - Chunking: 100 MB chunks (DEFAULT_CHUNK_SIZE = 100 * 1024 * 1024)
 * - Magic header: "MVLT" (0x4D, 0x56, 0x4C, 0x54)
 * - Cloud-synced manifests hidden in #MVLT:<Base64> message captions
 * - Two-pass index sync scanning topic messages
 */

import { MioHook, MioHookPoint } from '../hooks/MioHook';
import { MiogramCloudVaultFile } from './MiogramCloudVaultFile';

export const MANIFEST_PREFIX = '#MVLT:';
export const PART_PREFIX = '#MVLT_PART:';
export const DEFAULT_CHUNK_SIZE = 100 * 1024 * 1024; // 100MB
export const MAGIC_HEADER = new Uint8Array([0x4d, 0x56, 0x4c, 0x54]); // "MVLT"

const PREFS_VAULT_CHAT_ID = 'miogram_vault_chat_id';
const PREFS_MASTER_KEY = 'miogram_vault_master_key';

export class MiogramCloudVaultEngine {
  private static memoryFiles: Map<string, MiogramCloudVaultFile> = new Map();

  public static getVaultChatId(): number | undefined {
    try {
      const stored = localStorage.getItem(PREFS_VAULT_CHAT_ID);
      return stored ? Number(stored) : undefined;
    } catch {
      return undefined;
    }
  }

  public static setVaultChatId(chatId: number): void {
    try {
      localStorage.setItem(PREFS_VAULT_CHAT_ID, String(chatId));
    } catch {
      // Ignore storage errors
    }
  }

  public static async getMasterKey(): Promise<CryptoKey> {
    let rawHex = localStorage.getItem(PREFS_MASTER_KEY);
    if (!rawHex || rawHex.length !== 64) {
      const rawBytes = new Uint8Array(32); // 256 bits
      crypto.getRandomValues(rawBytes);
      rawHex = Array.from(rawBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      localStorage.setItem(PREFS_MASTER_KEY, rawHex);
    }

    const keyBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      keyBytes[i] = parseInt(rawHex.substr(i * 2, 2), 16);
    }

    return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  /**
   * Encrypts a chunk buffer using AES-256-GCM.
   * Format: [MAGIC 4B] + [IV 12B] + [Ciphertext + Tag]
   */
  public static async encryptChunk(plainData: Uint8Array): Promise<Uint8Array> {
    const key = await this.getMasterKey();
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plainData);
    const cipherBytes = new Uint8Array(cipherBuffer);

    const out = new Uint8Array(MAGIC_HEADER.length + iv.length + cipherBytes.length);
    out.set(MAGIC_HEADER, 0);
    out.set(iv, MAGIC_HEADER.length);
    out.set(cipherBytes, MAGIC_HEADER.length + iv.length);
    return out;
  }

  /**
   * Decrypts an encrypted chunk.
   */
  public static async decryptChunk(encryptedData: Uint8Array): Promise<Uint8Array> {
    if (encryptedData.length < MAGIC_HEADER.length + 12 + 16) {
      throw new Error('Encrypted chunk too small');
    }

    // Verify magic header
    for (let i = 0; i < MAGIC_HEADER.length; i++) {
      if (encryptedData[i] !== MAGIC_HEADER[i]) {
        throw new Error('Invalid magic header');
      }
    }

    const iv = encryptedData.subarray(4, 16);
    const cipherBytes = encryptedData.subarray(16);
    const key = await this.getMasterKey();

    const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
    return new Uint8Array(plainBuffer);
  }

  public static encodeManifest(file: MiogramCloudVaultFile): string {
    const jsonStr = JSON.stringify(file.toJson());
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    return `${MANIFEST_PREFIX}${base64}`;
  }

  public static decodeManifest(text: string): MiogramCloudVaultFile | undefined {
    if (!text || !text.includes(MANIFEST_PREFIX)) return undefined;
    try {
      const b64 = text.substring(text.indexOf(MANIFEST_PREFIX) + MANIFEST_PREFIX.length).trim();
      const jsonStr = decodeURIComponent(escape(atob(b64)));
      const obj = JSON.parse(jsonStr);
      return MiogramCloudVaultFile.fromJson(obj);
    } catch {
      return undefined;
    }
  }

  public static registerFile(file: MiogramCloudVaultFile): void {
    this.memoryFiles.set(file.fileId, file);
    MioHook.dispatch(MioHookPoint.VAULT_FILE_EVENT, { action: 'added', fileId: file.fileId });
  }

  public static getFiles(): MiogramCloudVaultFile[] {
    return Array.from(this.memoryFiles.values());
  }

  public static getFilesByTopic(topicId: number): MiogramCloudVaultFile[] {
    return Array.from(this.memoryFiles.values()).filter((f) => f.topicId === topicId);
  }
}

export default MiogramCloudVaultEngine;
