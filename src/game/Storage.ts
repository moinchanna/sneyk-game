import { STORAGE_KEYS } from './constants';

export class Storage {
  static getBestScore(): number {
    try {
      const score = localStorage.getItem(STORAGE_KEYS.BEST_SCORE);
      if (score === null) return 0;
      const parsed = parseInt(score, 10);
      return isNaN(parsed) ? 0 : parsed;
    } catch (e) {
      console.warn('localStorage is not available for reading best score:', e);
      return 0;
    }
  }

  static saveBestScore(score: number): void {
    try {
      const currentBest = this.getBestScore();
      if (score > currentBest) {
        localStorage.setItem(STORAGE_KEYS.BEST_SCORE, score.toString());
      }
    } catch (e) {
      console.warn('localStorage is not available for writing best score:', e);
    }
  }

  static getSoundPreference(): boolean {
    try {
      const pref = localStorage.getItem(STORAGE_KEYS.SOUND_PREF);
      // Default sound is disabled/off per guidelines ("Sound off or restrained by default")
      if (pref === null) return false;
      return pref === 'true';
    } catch (e) {
      console.warn('localStorage is not available for reading sound preference:', e);
      return false;
    }
  }

  static saveSoundPreference(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_PREF, enabled ? 'true' : 'false');
    } catch (e) {
      console.warn('localStorage is not available for writing sound preference:', e);
    }
  }

  static getReducedMotionPreference(): boolean {
    try {
      const pref = localStorage.getItem(STORAGE_KEYS.REDUCED_MOTION);
      if (pref === null) {
        // Fallback to system preference if matchMedia exists
        if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
          return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        return false;
      }
      return pref === 'true';
    } catch (e) {
      console.warn('localStorage is not available for reading reduced motion preference:', e);
      return false;
    }
  }

  static saveReducedMotionPreference(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REDUCED_MOTION, enabled ? 'true' : 'false');
    } catch (e) {
      console.warn('localStorage is not available for writing reduced motion preference:', e);
    }
  }
}
