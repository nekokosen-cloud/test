import type { PlayerSave } from '@/types';

const SAVE_KEY = 'pixel_fishing_save';

const DEFAULT_SAVE: PlayerSave = {
  caughtFish: {},
  totalCaught: 0,
  settings: { vibration: true },
};

export function loadPlayerSave(): PlayerSave {
  try {
    const data = wx.getStorageSync(SAVE_KEY);
    if (data) {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return { ...DEFAULT_SAVE, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SAVE };
}

export function persistPlayerSave(save: PlayerSave): void {
  try {
    wx.setStorageSync(SAVE_KEY, JSON.stringify(save));
  } catch {
    // ignore
  }
}

export { DEFAULT_SAVE, SAVE_KEY };
