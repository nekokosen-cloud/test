import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { KoiGrowthStage, KoiSave, KoiSkin, KoiState } from '@/types';
import {
  advanceKoiTime,
  createKoi,
  feedKoi,
  forceKillKoi,
  forceStage,
  petKoi,
  tickKoi,
} from '@/game/koi/koiSimulation';

export const KOI_SAVE_KEY = 'pixel_koi_save';

const DEFAULT_SAVE: KoiSave = {
  koi: null,
  totalRaised: 0,
  bestStageReached: 0,
};

function loadSave(): KoiSave {
  try {
    if (process.env.TARO_ENV === 'weapp') {
      const data = Taro.getStorageSync(KOI_SAVE_KEY);
      if (data) return { ...DEFAULT_SAVE, ...JSON.parse(data) };
    } else if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(KOI_SAVE_KEY);
      if (raw) return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SAVE };
}

function persistSave(save: KoiSave): void {
  const json = JSON.stringify(save);
  try {
    if (process.env.TARO_ENV === 'weapp') {
      Taro.setStorageSync(KOI_SAVE_KEY, json);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KOI_SAVE_KEY, json);
    }
  } catch {
    // ignore
  }
}

function updateBestStage(save: KoiSave, stage: KoiGrowthStage): KoiSave {
  return {
    ...save,
    bestStageReached: Math.max(save.bestStageReached, stage) as KoiGrowthStage,
  };
}

interface KoiStoreState {
  save: KoiSave;
  lastActionMessage: string;
  tick: () => void;
  adoptKoi: (name: string, skin: KoiSkin) => void;
  feed: () => { died: boolean; warning: boolean; message: string };
  pet: () => { ok: boolean; message: string };
  revive: (name: string, skin: KoiSkin) => void;
  devAdvanceHours: (hours: number) => void;
  devForceKill: () => void;
  devForceStage: (stage: KoiGrowthStage) => void;
}

export const useKoiStore = create<KoiStoreState>((set, get) => ({
  save: loadSave(),
  lastActionMessage: '',

  tick: () => {
    const { save } = get();
    if (!save.koi || !save.koi.isAlive) return;
    const nextKoi = tickKoi(save.koi);
    if (nextKoi === save.koi) return;
    const newSave = updateBestStage({ ...save, koi: nextKoi }, nextKoi.growthStage);
    persistSave(newSave);
    set({ save: newSave });
  },

  adoptKoi: (name, skin) => {
    const koi = createKoi(name, skin);
    const { save } = get();
    const newSave: KoiSave = {
      ...save,
      koi,
      totalRaised: save.totalRaised + 1,
      bestStageReached: Math.max(save.bestStageReached, 0) as KoiGrowthStage,
    };
    persistSave(newSave);
    set({ save: newSave, lastActionMessage: `${koi.name} 来到了池塘！` });
  },

  feed: () => {
    const { save } = get();
    if (!save.koi) {
      return { died: false, warning: false, message: '还没有锦鲤呢~' };
    }
    const result = feedKoi(save.koi);
    let newSave = updateBestStage({ ...save, koi: result.koi }, result.koi.growthStage);
    persistSave(newSave);
    set({ save: newSave, lastActionMessage: result.message });
    return { died: result.died, warning: result.warning, message: result.message };
  },

  pet: () => {
    const { save } = get();
    if (!save.koi) {
      return { ok: false, message: '还没有锦鲤呢~' };
    }
    const result = petKoi(save.koi);
    const newSave = updateBestStage({ ...save, koi: result.koi }, result.koi.growthStage);
    persistSave(newSave);
    set({ save: newSave, lastActionMessage: result.message });
    return { ok: result.ok, message: result.message };
  },

  revive: (name, skin) => {
    const koi = createKoi(name, skin);
    const { save } = get();
    const newSave: KoiSave = {
      ...save,
      koi,
      totalRaised: save.totalRaised + 1,
    };
    persistSave(newSave);
    set({ save: newSave, lastActionMessage: `${koi.name} 重新开始新生活！` });
  },

  devAdvanceHours: (hours) => {
    const { save } = get();
    if (!save.koi) return;
    const nextKoi = advanceKoiTime(save.koi, hours);
    const newSave = updateBestStage({ ...save, koi: nextKoi }, nextKoi.growthStage);
    persistSave(newSave);
    set({ save: newSave, lastActionMessage: `时间推进 ${hours} 小时` });
  },

  devForceKill: () => {
    const { save } = get();
    if (!save.koi) return;
    const nextKoi = forceKillKoi(save.koi);
    const newSave = { ...save, koi: nextKoi };
    persistSave(newSave);
    set({ save: newSave, lastActionMessage: nextKoi.deathMessage });
  },

  devForceStage: (stage) => {
    const { save } = get();
    if (!save.koi) return;
    const nextKoi = forceStage(save.koi, stage);
    const newSave = updateBestStage({ ...save, koi: nextKoi }, nextKoi.growthStage);
    persistSave(newSave);
    set({ save: newSave, lastActionMessage: `已跳到阶段 ${stage}` });
  },
}));

export function getLivingKoi(save: KoiSave): KoiState | null {
  return save.koi;
}
