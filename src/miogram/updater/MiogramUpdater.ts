/**
 * MiogramUpdater: Battery-friendly auto-updater with 24-hour cooldown.
 * Ported 1:1 from app.miogram.bridge.updater.MiogramUpdater.java.
 * Prevents aggressive polling rate-limits by strictly enforcing a 24h interval.
 */

export interface ReleaseInfo {
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
  htmlUrl: string;
}

const GITHUB_API_LATEST = 'https://api.github.com/repos/fuckramochka/miogram/releases/latest';
const KEY_LAST_CHECK_TIME = 'miogram_updater_last_check';
const KEY_DISMISSED_TAG = 'miogram_updater_dismissed_tag';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export class MiogramUpdater {
  public static async checkForUpdates(force = false): Promise<ReleaseInfo | undefined> {
    const now = Date.now();
    const lastCheckStr = localStorage.getItem(KEY_LAST_CHECK_TIME);
    const lastCheck = lastCheckStr ? Number(lastCheckStr) : 0;

    if (!force && now - lastCheck < COOLDOWN_MS) {
      // Within 24 hour cooldown period; do not query GitHub
      return undefined;
    }

    try {
      localStorage.setItem(KEY_LAST_CHECK_TIME, String(now));
      const res = await fetch(GITHUB_API_LATEST, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (!res.ok) return undefined;
      const data = await res.json();
      const tagName = String(data.tag_name || '');

      const dismissed = localStorage.getItem(KEY_DISMISSED_TAG);
      if (dismissed === tagName && !force) {
        return undefined;
      }

      return {
        tagName,
        name: data.name || tagName,
        body: data.body || '',
        publishedAt: data.published_at || '',
        htmlUrl: data.html_url || '',
      };
    } catch {
      return undefined;
    }
  }

  public static dismissUpdate(tagName: string): void {
    localStorage.setItem(KEY_DISMISSED_TAG, tagName);
  }
}

export default MiogramUpdater;
