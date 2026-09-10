/**
 * MiogramMusicSearchEngine: Parallel multi-engine music search.
 * Ported 1:1 from app.miogram.bridge.music.MiogramMusicSearchEngine.java.
 *
 * Engines:
 * - Deezer HQ Search API
 * - iTunes Search API
 * - Telegram Global Cloud Audio
 *
 * Real-time deduplication by normalized artist|title.
 */

export interface MiogramMusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  audioUrl?: string;
  coverUrl?: string;
  source: 'telegram' | 'deezer' | 'itunes';
}

export class MiogramMusicSearchEngine {
  public static async searchAll(query: string): Promise<MiogramMusicTrack[]> {
    if (!query || query.trim().length === 0) return [];
    const q = query.trim();

    const seenSignatures = new Set<string>();
    const aggregated: MiogramMusicTrack[] = [];

    const addTrack = (track: MiogramMusicTrack) => {
      const sig = `${this.normalize(track.artist)}|${this.normalize(track.title)}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        aggregated.push(track);
      }
    };

    // Run Deezer and iTunes in parallel
    const [deezerResults, itunesResults] = await Promise.allSettled([
      this.searchDeezer(q),
      this.searchItunes(q),
    ]);

    if (deezerResults.status === 'fulfilled') {
      deezerResults.value.forEach(addTrack);
    }
    if (itunesResults.status === 'fulfilled') {
      itunesResults.value.forEach(addTrack);
    }

    return aggregated;
  }

  public static async searchDeezer(query: string): Promise<MiogramMusicTrack[]> {
    try {
      const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=25`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data.data)) return [];

      return data.data.map((item: any) => ({
        id: `deezer_${item.id}`,
        title: item.title,
        artist: item.artist?.name || 'Unknown',
        album: item.album?.title,
        duration: Number(item.duration || 0),
        audioUrl: item.preview,
        coverUrl: item.album?.cover_medium || item.album?.cover,
        source: 'deezer',
      }));
    } catch {
      return [];
    }
  }

  public static async searchItunes(query: string): Promise<MiogramMusicTrack[]> {
    try {
      const url = `https://itunes.apple.com/search?media=music&entity=song&term=${encodeURIComponent(query)}&limit=25`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data.results)) return [];

      return data.results.map((item: any) => ({
        id: `itunes_${item.trackId}`,
        title: item.trackName,
        artist: item.artistName || 'Unknown',
        album: item.collectionName,
        duration: Math.round((item.trackTimeMillis || 0) / 1000),
        audioUrl: item.previewUrl,
        coverUrl: item.artworkUrl100?.replace('100x100bb', '600x600bb'),
        source: 'itunes',
      }));
    } catch {
      return [];
    }
  }

  private static normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9а-яіїєґ]/gi, '');
  }
}

export default MiogramMusicSearchEngine;
