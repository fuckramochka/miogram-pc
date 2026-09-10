/**
 * MiogramSupabaseBridge: Cloud bridge connecting Miogram Web to Supabase community database.
 * Ported 1:1 from app.miogram.bridge.badge.MiogramSupabaseBridge.java.
 *
 * Implements:
 * - Real-time cloud badge resolution with full lore & obtain history
 * - Sanitization of fake founders (only verified ID 8011880648 is treated as Founder)
 * - LocalStorage caching for zero-latency instant rendering
 * - Real-time community stats via miogram_community_stats RPC
 * - User presence tracking via miogram_users
 */

import { MiogramBadgeType, BadgeDefinition } from './MiogramBadgeType';

export const FOUNDER_USER_ID = 8011880648;
export const DEFAULT_SUPABASE_URL = 'https://dbxsnjoeyiqvqtrluvwu.supabase.co';
export const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRieHNuam9leWlxdnF0cmx1dnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NDI1MzEsImV4cCI6MjEwNDExODUzMX0.KJ0kvON1HXZu4MzlZjapSJEhEzWYlEqQoNEstWCgIjA';

export interface BadgeRecord {
  userId: number;
  badgeType: BadgeDefinition;
  title: string;
  obtainedReason: string;
  obtainedAt: string;
  isActive: boolean;
  verified: boolean;
  grantorId: number;
}

export interface CommunityStats {
  usersCount: number;
  badgesCount: number;
  updatedAt: string;
}

const CACHE_KEY = 'miogram_badge_cache_cloud_v1';

export class MiogramSupabaseBridge {
  private static badgeCache: Map<number, BadgeRecord> = new Map();
  private static isInitialized = false;

  public static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Restore cached badges from localStorage
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, any>;
        for (const [uid, item] of Object.entries(parsed)) {
          const numId = Number(uid);
          this.badgeCache.set(numId, this.sanitizeRecord(numId, item));
        }
      }
    } catch {
      // Ignore cache parse error
    }

    // 2. Fetch fresh badges in background
    this.fetchBadgesFromCloud();
  }

  public static async fetchBadgesFromCloud(): Promise<Map<number, BadgeRecord>> {
    try {
      const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/miogram_badges?is_active=eq.true&select=*`, {
        headers: {
          apikey: DEFAULT_ANON_KEY,
          Authorization: `Bearer ${DEFAULT_ANON_KEY}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as any[];

      const cacheDump: Record<string, any> = {};
      for (const row of data) {
        const userId = Number(row.user_id);
        const record = this.sanitizeRecord(userId, row);
        this.badgeCache.set(userId, record);
        cacheDump[userId] = record;
      }

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheDump));
      } catch {
        // Storage quota
      }
    } catch (err) {
      console.warn('[MiogramSupabaseBridge] Failed to fetch badges from cloud:', err);
    }

    return this.badgeCache;
  }

  public static getBadgeForUser(userId: number): BadgeRecord | undefined {
    return this.badgeCache.get(userId);
  }

  /**
   * Anti-abuse sanitization:
   * Only user 8011880648 with verified=true may display Founder lore.
   * Hostile or spoofed founder claims on arbitrary IDs are neutralized to regular member badges.
   */
  private static sanitizeRecord(userId: number, row: any): BadgeRecord {
    let title = String(row.title || 'Miogram Community ໒꒱');
    let reason = String(row.obtained_reason || 'Верифікований учасник спільноти Miogram');
    let badgeId = String(row.badge_id || 'original').toLowerCase();
    const verified = Boolean(row.verified);
    const grantorId = Number(row.grantor_id || 0);

    const isGenuineFounder = userId === FOUNDER_USER_ID && (verified || grantorId === FOUNDER_USER_ID);

    if (!isGenuineFounder && (title.includes('Засновник') || title.includes('Founder') || title.includes('Архітектор'))) {
      title = 'Miogram Community ໒꒱';
      reason = 'Учасник спільноти Miogram';
    }

    return {
      userId,
      badgeType: MiogramBadgeType.getById(badgeId),
      title,
      obtainedReason: reason,
      obtainedAt: row.obtained_at || '01.09.2026',
      isActive: row.is_active !== false,
      verified,
      grantorId,
    };
  }

  public static async reportPresence(userId: number, clientVersion = 'Miogram Web 1.0'): Promise<void> {
    if (!userId) return;
    try {
      await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/miogram_users`, {
        method: 'POST',
        headers: {
          apikey: DEFAULT_ANON_KEY,
          Authorization: `Bearer ${DEFAULT_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: userId,
          last_seen_at: new Date().toISOString(),
          client_version: clientVersion,
        }),
      });
    } catch (err) {
      console.warn('[MiogramSupabaseBridge] Presence report failed:', err);
    }
  }

  public static async fetchCommunityStats(): Promise<CommunityStats | undefined> {
    try {
      const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/rpc/miogram_community_stats`, {
        method: 'POST',
        headers: {
          apikey: DEFAULT_ANON_KEY,
          Authorization: `Bearer ${DEFAULT_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        usersCount: Number(data.users_count || 0),
        badgesCount: Number(data.badges_count || 0),
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    } catch (err) {
      console.warn('[MiogramSupabaseBridge] fetchCommunityStats error:', err);
      return undefined;
    }
  }

  public static async grantBadgeByFounder(
    targetUserId: number,
    badgeId: string,
    title: string,
    reason: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/miogram_badges`, {
        method: 'POST',
        headers: {
          apikey: DEFAULT_ANON_KEY,
          Authorization: `Bearer ${DEFAULT_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: targetUserId,
          badge_id: badgeId,
          title,
          obtained_reason: reason,
          is_active: true,
          grantor_id: FOUNDER_USER_ID,
          client_version: 'Miogram Web Founder Edition',
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export default MiogramSupabaseBridge;
