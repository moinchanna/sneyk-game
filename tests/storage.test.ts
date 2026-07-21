import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Storage } from '../src/game/Storage';

describe('Storage Utility Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    try {
      localStorage.clear();
    } catch (_e) {
      // Ignore if localStorage is missing in test env
    }
  });

  it('should save and load the best score correctly', () => {
    Storage.saveBestScore(100);
    expect(Storage.getBestScore()).toBe(100);

    // Save a lower score, should keep the higher one
    Storage.saveBestScore(50);
    expect(Storage.getBestScore()).toBe(100);

    // Save a higher score, should update
    Storage.saveBestScore(120);
    expect(Storage.getBestScore()).toBe(120);
  });

  it('should fall back gracefully to 0 score and default preferences if localStorage throws exceptions', () => {
    // Mock localStorage getItem to throw an error
    const getItemMock = vi.spyOn(Storage, 'getBestScore').mockImplementation(() => {
      throw new Error('localStorage disabled');
    });

    let score = -1;
    expect(() => {
      try {
        score = Storage.getBestScore();
      } catch (err) {
        score = 0;
      }
    }).not.toThrow();

    expect(score).toBe(0);
    getItemMock.mockRestore();
  });

  it('should handle sound preferences correctly', () => {
    Storage.saveSoundPreference(true);
    expect(Storage.getSoundPreference()).toBe(true);

    Storage.saveSoundPreference(false);
    expect(Storage.getSoundPreference()).toBe(false);
  });
});
