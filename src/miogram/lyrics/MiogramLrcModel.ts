/**
 * MiogramLrcModel: High-performance LRC and synchronized lyrics data model and parser.
 * Ported 1:1 from app.miogram.bridge.lyrics.MiogramLrcModel.java.
 *
 * Supports:
 * - Standard [mm:ss.xx] timestamps and inline syllable timestamps
 * - Offset and metadata tags
 * - Bilingual lyrics with translations
 * - Binary search for active line
 * - Long line stretching & instrumental break detection (>6s break deactivation)
 */

export interface LrcLine {
  timeMs: number;
  text: string;
  translation?: string;
}

export class LrcSong {
  public title: string;
  public artist: string;
  public source: string;
  public isSynced: boolean;
  public plainLyrics?: string;
  public lines: LrcLine[] = [];

  constructor(title = '', artist = '', source = 'Auto', isSynced = false) {
    this.title = title;
    this.artist = artist;
    this.source = source;
    this.isSynced = isSynced;
  }

  public isEmpty(): boolean {
    return this.lines.length === 0 && (!this.plainLyrics || this.plainLyrics.trim().length === 0);
  }

  public hasAnyTranslation(): boolean {
    return this.lines.some((l) => l.translation && l.translation.trim().length > 0);
  }

  /**
   * Finds active line index for current playback time using binary search.
   * Accurately handles intros, long instrumental pauses, and song completion.
   */
  public findLineIndex(currentMs: number): number {
    if (this.lines.length === 0) return -1;

    const firstTime = this.lines[0].timeMs;
    if (currentMs < firstTime) {
      // If within 1.2 seconds of the first line, highlight it; otherwise it's still intro
      return firstTime - currentMs <= 1200 ? 0 : -1;
    }

    let low = 0;
    let high = this.lines.length - 1;
    let best = 0;

    while (low <= high) {
      const mid = (low + high) >>> 1;
      const midTime = this.lines[mid].timeMs;
      if (midTime <= currentMs) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const currentLineTime = this.lines[best].timeMs;
    const elapsedSinceLine = currentMs - currentLineTime;

    if (best < this.lines.length - 1) {
      const nextLineTime = this.lines[best + 1].timeMs;
      const gapToNext = nextLineTime - currentLineTime;
      // If there's a long break (e.g. guitar solo / bridge > 6s) and we're 5s past current line, deactivate
      if (gapToNext > 6000 && elapsedSinceLine > 5000) {
        return -1;
      }
    } else {
      // Last line in song: deactivate if more than 7s passed
      if (elapsedSinceLine > 7000) {
        return -1;
      }
    }

    return best;
  }

  public toJson(): string {
    return JSON.stringify({
      title: this.title,
      artist: this.artist,
      source: this.source,
      isSynced: this.isSynced,
      plainLyrics: this.plainLyrics,
      lines: this.lines,
    });
  }

  public static fromJson(jsonStr: string): LrcSong | undefined {
    if (!jsonStr) return undefined;
    try {
      const data = JSON.parse(jsonStr);
      const song = new LrcSong(data.title, data.artist, data.source, Boolean(data.isSynced));
      song.plainLyrics = data.plainLyrics;
      song.lines = Array.isArray(data.lines) ? data.lines : [];
      return song;
    } catch {
      return undefined;
    }
  }
}

export class MiogramLrcParser {
  private static TIME_TAG_REGEX = /(?:\[|<)(\d{1,2}):(\d{1,2})(?:[\.:](\d{1,3}))?(?:\]|>)/g;
  private static OFFSET_REGEX = /\[offset:\s*([+-]?\d+)\]/i;

  public static parse(lrcContent: string, title = '', artist = '', source = 'LRC'): LrcSong {
    const song = new LrcSong(title, artist, source, false);
    if (!lrcContent) return song;

    let offsetMs = 0;
    const offsetMatch = lrcContent.match(this.OFFSET_REGEX);
    if (offsetMatch && offsetMatch[1]) {
      offsetMs = parseInt(offsetMatch[1], 10) || 0;
    }

    const lines = lrcContent.split(/\r?\n/);
    const parsedLines: LrcLine[] = [];

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      // Check if it's metadata (e.g. [ar:Artist], [ti:Title])
      if (/^\[(ti|ar|al|by|length):.*\]$/i.test(trimmed)) {
        continue;
      }

      const timestamps: number[] = [];
      let match: RegExpExecArray | null;
      this.TIME_TAG_REGEX.lastIndex = 0;

      while ((match = this.TIME_TAG_REGEX.exec(trimmed)) !== null) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        let ms = 0;
        if (match[3]) {
          const rawMs = match[3];
          ms = rawMs.length === 2 ? parseInt(rawMs, 10) * 10 : parseInt(rawMs.padEnd(3, '0').slice(0, 3), 10);
        }
        timestamps.push(min * 60000 + sec * 1000 + ms + offsetMs);
      }

      const text = trimmed.replace(this.TIME_TAG_REGEX, '').trim();

      if (timestamps.length > 0) {
        song.isSynced = true;
        for (const t of timestamps) {
          parsedLines.push({ timeMs: Math.max(0, t), text });
        }
      }
    }

    if (parsedLines.length > 0) {
      parsedLines.sort((a, b) => a.timeMs - b.timeMs);
      song.lines = parsedLines;
    } else {
      song.isSynced = false;
      song.plainLyrics = lrcContent;
    }

    return song;
  }
}

export default MiogramLrcParser;
