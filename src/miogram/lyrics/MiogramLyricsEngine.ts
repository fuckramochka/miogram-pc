/**
 * MiogramLyricsEngine: Multi-source synchronized lyrics provider.
 * Ported 1:1 from app.miogram.bridge.lyrics.MiogramLyricsEngine.java.
 *
 * Sources:
 * - SOURCE_AUTO (Auto cascade)
 * - SOURCE_LRCLIB (LRCLib synchronized API)
 * - SOURCE_NETEASE (NetEase Cloud Music API)
 * - SOURCE_GENIUS (Genius lyrics)
 * - SOURCE_FALLBACK (Plaintext)
 */

import { LrcSong, MiogramLrcParser } from './MiogramLrcModel';

export const SOURCE_AUTO = 0;
export const SOURCE_SERVER = 1;
export const SOURCE_LRCLIB = 2;
export const SOURCE_NETEASE = 3;
export const SOURCE_YANDEX = 4;
export const SOURCE_GENIUS = 5;

const CACHE_PREFIX = 'miogram_lrc_cache_';

export class MiogramLyricsEngine {
  private static memoryCache: Map<string, LrcSong> = new Map();

  public static async fetchLyrics(
    title: string,
    artist = '',
    durationSec = 0,
    source = SOURCE_AUTO
  ): Promise<LrcSong | undefined> {
    const cleanT = this.cleanTitle(title);
    const cleanA = this.cleanArtist(artist);
    if (!cleanT) return undefined;

    const cacheKey = `${cleanA.toLowerCase()} - ${cleanT.toLowerCase()}`;
    const cached = this.memoryCache.get(cacheKey);
    if (cached) return cached;

    // Try localStorage
    try {
      const stored = localStorage.getItem(`${CACHE_PREFIX}${cacheKey}`);
      if (stored) {
        const parsed = LrcSong.fromJson(stored);
        if (parsed) {
          this.memoryCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {
      // Storage unavailable
    }

    let song: LrcSong | undefined;

    if (source === SOURCE_LRCLIB || source === SOURCE_AUTO) {
      song = await this.fetchFromLrclib(cleanT, cleanA, durationSec);
    }

    if (!song && (source === SOURCE_NETEASE || source === SOURCE_AUTO)) {
      song = await this.fetchFromNetEase(cleanT, cleanA);
    }

    if (song && !song.isEmpty()) {
      this.memoryCache.set(cacheKey, song);
      try {
        localStorage.setItem(`${CACHE_PREFIX}${cacheKey}`, song.toJson());
      } catch {
        // Storage quota
      }
      return song;
    }

    return undefined;
  }

  private static async fetchFromLrclib(
    title: string,
    artist: string,
    durationSec: number
  ): Promise<LrcSong | undefined> {
    try {
      const url = new URL('https://lrclib.net/api/get');
      url.searchParams.set('track_name', title);
      if (artist) url.searchParams.set('artist_name', artist);
      if (durationSec > 0) url.searchParams.set('duration', String(Math.round(durationSec)));

      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'Miogram-Web/1.0 (https://github.com/TelegramOrg/Telegram-web-z)' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics) {
          return MiogramLrcParser.parse(data.syncedLyrics, title, artist, 'LRCLib');
        } else if (data.plainLyrics) {
          const s = new LrcSong(title, artist, 'LRCLib', false);
          s.plainLyrics = data.plainLyrics;
          return s;
        }
      }

      // If exact match failed, try search endpoint
      const searchUrl = new URL('https://lrclib.net/api/search');
      searchUrl.searchParams.set('q', `${artist} ${title}`.trim());
      const searchRes = await fetch(searchUrl.toString());
      if (searchRes.ok) {
        const list = (await searchRes.json()) as any[];
        for (const item of list) {
          if (this.isMatchingTrack(title, artist, durationSec, item.trackName, item.artistName, item.duration)) {
            if (item.syncedLyrics) {
              return MiogramLrcParser.parse(item.syncedLyrics, title, artist, 'LRCLib');
            } else if (item.plainLyrics) {
              const s = new LrcSong(title, artist, 'LRCLib', false);
              s.plainLyrics = item.plainLyrics;
              return s;
            }
          }
        }
      }
    } catch {
      // Ignore network failures
    }

    return undefined;
  }

  private static async fetchFromNetEase(title: string, artist: string): Promise<LrcSong | undefined> {
    try {
      const searchUrl = `https://music.163.com/api/search/get/web?csrf_token=&hlpretag=&hlposttag=&s=${encodeURIComponent(
        `${artist} ${title}`
      )}&type=1&offset=0&total=true&limit=3`;
      const sRes = await fetch(searchUrl);
      if (!sRes.ok) return undefined;
      const sData = await sRes.json();
      const firstSong = sData.result?.songs?.[0];
      if (!firstSong || !firstSong.id) return undefined;

      const lrcUrl = `https://music.163.com/api/song/lyric?os=pc&id=${firstSong.id}&lv=-1&kv=-1&tv=-1`;
      const lRes = await fetch(lrcUrl);
      if (!lRes.ok) return undefined;
      const lData = await lRes.json();

      const lrcText = lData.lrc?.lyric;
      if (lrcText) {
        const song = MiogramLrcParser.parse(lrcText, title, artist, 'NetEase');
        // Check translation
        const transText = lData.tlyric?.lyric;
        if (transText) {
          const transSong = MiogramLrcParser.parse(transText);
          for (const line of song.lines) {
            const match = transSong.lines.find((tl) => Math.abs(tl.timeMs - line.timeMs) < 200);
            if (match && match.text) {
              line.translation = match.text;
            }
          }
        }
        return song;
      }
    } catch {
      // Ignore network errors
    }

    return undefined;
  }

  private static isMatchingTrack(
    targetTitle: string,
    targetArtist: string,
    targetDur: number,
    candidateTitle: string,
    candidateArtist: string,
    candidateDur: number
  ): boolean {
    if (targetDur > 0 && candidateDur > 0) {
      if (Math.abs(targetDur - candidateDur) > 6) return false;
    }
    const tClean = this.cleanTitle(targetTitle).toLowerCase();
    const cClean = this.cleanTitle(candidateTitle).toLowerCase();
    return tClean.includes(cClean) || cClean.includes(tClean);
  }

  public static cleanTitle(title: string): string {
    return title
      .replace(/\.(mp3|flac|wav|m4a|ogg|opus)$/i, '')
      .replace(/\s*[\(\[](official\s*(video|audio|lyrics|music\s*video)|lyrics|remastered|feat\..*|ft\..*)[\)\]]/gi, '')
      .trim();
  }

  public static cleanArtist(artist: string): string {
    return artist.replace(/\s*[-_–]\s*topic$/i, '').trim();
  }
}

export default MiogramLyricsEngine;
