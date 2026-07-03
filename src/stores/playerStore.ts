import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type {
  CaughtFishRecord,
  EnvironmentId,
  Fish,
  PlayerSave,
  WeatherId,
} from '@/types';
import { SAVE_KEY } from '@/systems/vibration';

const DEFAULT_SAVE: PlayerSave = {
  caughtFish: {},
  totalCaught: 0,
  settings: { vibration: true },
};

function loadSave(): PlayerSave {
  try {
    if (process.env.TARO_ENV === 'weapp') {
      const data = Taro.getStorageSync(SAVE_KEY);
      if (data) return { ...DEFAULT_SAVE, ...JSON.parse(data) };
    } else if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SAVE };
}

function persistSave(save: PlayerSave): void {
  const json = JSON.stringify(save);
  try {
    if (process.env.TARO_ENV === 'weapp') {
      Taro.setStorageSync(SAVE_KEY, json);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SAVE_KEY, json);
    }
  } catch {
    // ignore
  }
}

interface PlayerState {
  save: PlayerSave;
  environmentId: EnvironmentId;
  weatherId: WeatherId;
  setEnvironment: (id: EnvironmentId) => void;
  setWeather: (id: WeatherId) => void;
  recordCatch: (fish: Fish) => boolean;
  isDiscovered: (fishId: string) => boolean;
  getCaughtCount: (fishId: string) => number;
  getDiscoveredCount: () => number;
  toggleVibration: () => void;
  resetSave: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  save: loadSave(),
  environmentId: 'lake',
  weatherId: 'sunny',

  setEnvironment: (id) => set({ environmentId: id }),
  setWeather: (id) => set({ weatherId: id }),

  recordCatch: (fish) => {
    const { save } = get();
    const isNew = !save.caughtFish[fish.id];
    const now = new Date().toISOString();
    const existing: CaughtFishRecord = save.caughtFish[fish.id] ?? {
      count: 0,
      firstCaughtAt: now,
    };

    const newSave: PlayerSave = {
      ...save,
      totalCaught: save.totalCaught + 1,
      caughtFish: {
        ...save.caughtFish,
        [fish.id]: {
          count: existing.count + 1,
          firstCaughtAt: existing.firstCaughtAt,
        },
      },
    };

    persistSave(newSave);
    set({ save: newSave });
    return isNew;
  },

  isDiscovered: (fishId) => !!get().save.caughtFish[fishId],
  getCaughtCount: (fishId) => get().save.caughtFish[fishId]?.count ?? 0,
  getDiscoveredCount: () => Object.keys(get().save.caughtFish).length,

  toggleVibration: () => {
    const { save } = get();
    const newSave = {
      ...save,
      settings: { ...save.settings, vibration: !save.settings.vibration },
    };
    persistSave(newSave);
    set({ save: newSave });
  },

  resetSave: () => {
    persistSave(DEFAULT_SAVE);
    set({ save: { ...DEFAULT_SAVE } });
  },
}));
