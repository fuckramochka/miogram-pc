/**
 * MiogramPerfOptimizer: High refresh rate & battery saving optimizer.
 * Ported 1:1 from app.miogram.bridge.perf.MiogramPerformanceOptimizer.java.
 */

export class MiogramPerfOptimizer {
  private static isPowerSaveMode = false;
  private static isInitialized = false;

  public static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Monitor document visibility
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          document.documentElement.classList.add('miogram-background-idle');
        } else {
          document.documentElement.classList.remove('miogram-background-idle');
        }
      });
    }

    // Monitor Battery API if available
    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          // If battery is discharging and <= 20% or saver is active
          const isLow = !battery.charging && battery.level <= 0.2;
          this.setPowerSave(isLow);
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {
        // Battery API not supported
      });
    }
  }

  public static isPowerSaveActive(): boolean {
    return this.isPowerSaveMode;
  }

  public static setPowerSave(active: boolean): void {
    this.isPowerSaveMode = active;
    if (typeof document !== 'undefined') {
      if (active) {
        document.documentElement.classList.add('miogram-powersave');
      } else {
        document.documentElement.classList.remove('miogram-powersave');
      }
    }
  }
}

export default MiogramPerfOptimizer;
