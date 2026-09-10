/**
 * MioHook — Unified event bus for Miogram Web / Desktop.
 * Ported 1:1 from app.miogram.bridge.hooks.MioHook.java.
 *
 * Characteristics:
 * - Ordered: higher priority runs first (descending).
 * - Isolated: throwing hooks never break callers; 3 consecutive failures quarantine (auto-disable) with log.
 * - Observable: per-point dispatch counts, latency, and error counts.
 * - Ownable: unregisterAll(owner) detaches entire plugin.
 */

export enum MioHookPoint {
  /** Vetoable. Fired before a message is sent. Return false to cancel. */
  MESSAGE_PRE_SEND = 'MESSAGE_PRE_SEND',
  /** Fired for every incoming message. */
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  /** Vetoable per feed card. Return false to drop the item. */
  FEED_ITEM = 'FEED_ITEM',
  /** Mutable result filter for AI text (summary/digest/rephrase). */
  AI_TEXT_RESULT = 'AI_TEXT_RESULT',
  /** Fired when audio track or play state changes. */
  AUDIO_TRACK_CHANGED = 'AUDIO_TRACK_CHANGED',
  /** Fired after a divine preset is applied. */
  PRESET_CHANGED = 'PRESET_CHANGED',
  /** Fired on vault file uploaded / downloaded / deleted. */
  VAULT_FILE_EVENT = 'VAULT_FILE_EVENT',
  /** Vetoable. Return false to hide a dialog row (duress-style filter). */
  DIALOG_VISIBILITY = 'DIALOG_VISIBILITY',
  /** Fired when a named UI container is mounted. */
  UI_CONTAINER = 'UI_CONTAINER',
}

export interface HookRegistration<T = unknown> {
  id: string;
  owner: string;
  point: MioHookPoint;
  priority: number;
  handler: (payload: T) => unknown;
  consecutiveFailures: number;
  isQuarantined: boolean;
}

export interface HookStats {
  dispatches: number;
  totalTimeMs: number;
  errors: number;
  quarantinedCount: number;
}

export class MioHook {
  private static hooks: Map<MioHookPoint, HookRegistration[]> = new Map();
  private static stats: Map<MioHookPoint, HookStats> = new Map();
  private static idCounter = 0;

  private static getStats(point: MioHookPoint): HookStats {
    let s = this.stats.get(point);
    if (!s) {
      s = { dispatches: 0, totalTimeMs: 0, errors: 0, quarantinedCount: 0 };
      this.stats.set(point, s);
    }
    return s;
  }

  public static register<T = unknown>(
    point: MioHookPoint,
    owner: string,
    handler: (payload: T) => unknown,
    priority = 0
  ): string {
    const id = `hook_${++this.idCounter}_${Date.now()}`;
    const list = this.hooks.get(point) || [];
    const reg: HookRegistration<T> = {
      id,
      owner,
      point,
      priority,
      handler: handler as (payload: unknown) => unknown,
      consecutiveFailures: 0,
      isQuarantined: false,
    };
    list.push(reg as HookRegistration);
    // Sort descending by priority
    list.sort((a, b) => b.priority - a.priority);
    this.hooks.set(point, list);
    return id;
  }

  public static unregister(id: string): boolean {
    let removed = false;
    for (const [point, list] of this.hooks.entries()) {
      const idx = list.findIndex((h) => h.id === id);
      if (idx !== -1) {
        list.splice(idx, 1);
        removed = true;
      }
    }
    return removed;
  }

  public static unregisterAll(owner: string): number {
    let count = 0;
    for (const [point, list] of this.hooks.entries()) {
      const filtered = list.filter((h) => {
        if (h.owner === owner) {
          count++;
          return false;
        }
        return true;
      });
      this.hooks.set(point, filtered);
    }
    return count;
  }

  /**
   * Dispatch for non-vetoable events. Runs all active listeners safely.
   */
  public static dispatch<T = unknown>(point: MioHookPoint, payload: T): void {
    const list = this.hooks.get(point);
    if (!list || list.length === 0) return;

    const stats = this.getStats(point);
    stats.dispatches++;
    const start = performance.now();

    for (const reg of list) {
      if (reg.isQuarantined) continue;
      try {
        reg.handler(payload);
        reg.consecutiveFailures = 0;
      } catch (err) {
        stats.errors++;
        reg.consecutiveFailures++;
        console.error(`[MioHook] Error in hook ${reg.id} (${reg.owner}) on ${point}:`, err);
        if (reg.consecutiveFailures >= 3) {
          reg.isQuarantined = true;
          stats.quarantinedCount++;
          console.warn(`[MioHook] Hook ${reg.id} (${reg.owner}) quarantined after 3 consecutive failures`);
        }
      }
    }

    stats.totalTimeMs += performance.now() - start;
  }

  /**
   * Dispatch for vetoable events (e.g. MESSAGE_PRE_SEND, DIALOG_VISIBILITY, FEED_ITEM).
   * Returns false if any active hook returns false.
   */
  public static dispatchVetoable<T = unknown>(point: MioHookPoint, payload: T): boolean {
    const list = this.hooks.get(point);
    if (!list || list.length === 0) return true;

    const stats = this.getStats(point);
    stats.dispatches++;
    const start = performance.now();
    let result = true;

    for (const reg of list) {
      if (reg.isQuarantined) continue;
      try {
        const res = reg.handler(payload);
        reg.consecutiveFailures = 0;
        if (res === false) {
          result = false;
        }
      } catch (err) {
        stats.errors++;
        reg.consecutiveFailures++;
        console.error(`[MioHook] Error in vetoable hook ${reg.id} (${reg.owner}) on ${point}:`, err);
        if (reg.consecutiveFailures >= 3) {
          reg.isQuarantined = true;
          stats.quarantinedCount++;
          console.warn(`[MioHook] Hook ${reg.id} quarantined after 3 consecutive failures`);
        }
      }
    }

    stats.totalTimeMs += performance.now() - start;
    return result;
  }

  public static dumpStats(): Record<string, HookStats> {
    const out: Record<string, HookStats> = {};
    for (const [k, v] of this.stats.entries()) {
      out[k] = { ...v };
    }
    return out;
  }

  public static resetQuarantine(owner?: string): void {
    for (const list of this.hooks.values()) {
      for (const reg of list) {
        if (!owner || reg.owner === owner) {
          reg.isQuarantined = false;
          reg.consecutiveFailures = 0;
        }
      }
    }
  }
}

export default MioHook;
