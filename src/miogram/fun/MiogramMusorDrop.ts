/**
 * MiogramMusorDrop: Easter egg triggered by tg://musor_drop.
 * Ported 1:1 from app.miogram.bridge.fun.MiogramMusorDrop.java.
 *
 * Tapping a tg://musor_drop link blacks out the viewport, plays the bundled drop
 * (video/audio) fullscreen, and dismisses when playback ends or on tap.
 */

export const TRIGGER_URL = 'tg://musor_drop';

export class MiogramMusorDrop {
  private static overlayElement: HTMLElement | null = null;

  public static isTrigger(url?: string): boolean {
    if (!url) return false;
    let u = url.trim().toLowerCase();
    if (u.endsWith('/')) u = u.slice(0, -1);
    return u === TRIGGER_URL || u === 'tg:musor_drop';
  }

  public static tryHandle(url?: string): boolean {
    if (!this.isTrigger(url)) return false;
    this.showOverlay();
    return true;
  }

  public static showOverlay(): void {
    if (typeof document === 'undefined') return;
    if (this.overlayElement) return;

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = '#000000';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.cursor = 'pointer';

    const video = document.createElement('video');
    video.src = '/musordrop.mp4';
    video.autoplay = true;
    video.playsInline = true;
    video.style.maxWidth = '100%';
    video.style.maxHeight = '100%';
    video.style.objectFit = 'contain';

    const dismiss = () => {
      if (this.overlayElement) {
        document.body.removeChild(this.overlayElement);
        this.overlayElement = null;
      }
    };

    video.onended = dismiss;
    video.onerror = () => {
      // Missing media fallback
      const hint = document.createElement('div');
      hint.style.color = '#ffffff';
      hint.style.fontFamily = 'monospace';
      hint.style.fontSize = '1.25rem';
      hint.style.textAlign = 'center';
      hint.innerHTML = 'MUSOR NOT FOUND<br><span style="opacity:0.6;font-size:0.9rem">kin\' musordrop.mp4 v public/</span>';
      overlay.appendChild(hint);
      setTimeout(dismiss, 2500);
    };

    overlay.onclick = dismiss;
    overlay.appendChild(video);
    document.body.appendChild(overlay);
    this.overlayElement = overlay;
  }
}

export default MiogramMusorDrop;
