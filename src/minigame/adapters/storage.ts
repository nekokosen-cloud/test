import type { PlayerSave } from '@/types';

const SAVE_KEY = 'pixel_fishing_save';

export const DEFAULT_SAVE: PlayerSave = {
  caughtFish: {},
  totalCaught: 0,
  coins: 0,
  bestStreak: 0,
  currentStreak: 0,
  environmentId: 'lake',
  weatherId: 'sunny',
  timeOfDay: 'day',
  rodId: 'basic',
  baitId: 'none',
  ownedRodIds: ['basic'],
  settings: { vibration: true, sound: true },
};

function mergeSave(parsed: Partial<PlayerSave>): PlayerSave {
  return {
    ...DEFAULT_SAVE,
    ...parsed,
    caughtFish: parsed.caughtFish ?? {},
    ownedRodIds: parsed.ownedRodIds ?? DEFAULT_SAVE.ownedRodIds,
    settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings ?? {}) },
  };
}

export function loadPlayerSave(): PlayerSave {
  try {
    const data = wx.getStorageSync(SAVE_KEY);
    if (data) {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return mergeSave(parsed);
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

export { SAVE_KEY };
