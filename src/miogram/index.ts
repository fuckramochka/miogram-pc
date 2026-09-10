/**
 * Miogram Master Subsystem Entrypoint.
 * Orchestrates all ported modules: Divine presets, Supabase badges, Vault, Lyrics, AI, CloudVault, and Plugins.
 */

import { MiogramDivineEngine } from './divine/MiogramDivineEngine';
import { MiogramSupabaseBridge } from './badge/MiogramSupabaseBridge';
import { MiogramVault } from './vault/MiogramVault';
import { MiogramPerfOptimizer } from './perf/MiogramPerfOptimizer';
import { MiogramMusorDrop } from './fun/MiogramMusorDrop';
import { MiogramUpdater } from './updater/MiogramUpdater';

import './styles/miogram.scss';

export * from './divine/MiogramDivineEngine';
export * from './badge/MiogramBadgeType';
export * from './badge/MiogramSupabaseBridge';
export * from './vault/MiogramVault';
export * from './lyrics/MiogramLrcModel';
export * from './lyrics/MiogramLyricsEngine';
export * from './music/MiogramMusicSearchEngine';
export * from './ai/MiogramAiService';
export * from './cloudvault/MiogramCloudVaultFile';
export * from './cloudvault/MiogramCloudVaultEngine';
export * from './plugins/MiogramWasmRuntime';
export * from './hooks/MioHook';
export * from './kanban/MiogramKanbanStorage';
export * from './updater/MiogramUpdater';
export * from './localizer/MiogramLocale';
export * from './perf/MiogramPerfOptimizer';
export * from './fun/MiogramMusorDrop';

let isMiogramInitialized = false;

export function initMiogram(): void {
  if (isMiogramInitialized) return;
  isMiogramInitialized = true;

  console.log('✦ [Miogram] Initializing Miogram Suite for Web Z & Tauri ໒꒱');

  // 1. Initialize Divine Preset Layout Engine
  MiogramDivineEngine.init();

  // 2. Initialize Supabase Badge Cloud Bridge
  MiogramSupabaseBridge.init();

  // 3. Initialize Zero-Knowledge Vault & Duress PIN
  MiogramVault.init();

  // 4. Initialize Performance & Battery Optimizer
  MiogramPerfOptimizer.init();

  // 5. Check for updates (24h cooldown enforced)
  MiogramUpdater.checkForUpdates().then((update) => {
    if (update) {
      console.log(`[Miogram] New update available: ${update.tagName}`);
    }
  });

  // 6. Global link click listener for tg://musor_drop easter egg
  if (typeof window !== 'undefined') {
    window.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (target && target.href) {
        if (MiogramMusorDrop.tryHandle(target.href)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }, true);
  }
}

export default initMiogram;
