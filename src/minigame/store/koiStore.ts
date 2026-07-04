import type { KoiGrowthStage, KoiSave, KoiSkin, KoiState } from '@/types';
import {
  advanceKoiTime,
  createKoi,
  feedKoi,
  forceKillKoi,
  forceStage,
  getStageName,
  getStatusMessage,
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
    const data = wx.getStorageSync(KOI_SAVE_KEY);
    if (data) {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return { ...DEFAULT_SAVE, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SAVE };
}

function persistSave(save: KoiSave): void {
  try {
    wx.setStorageSync(KOI_SAVE_KEY, JSON.stringify(save));
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

export class KoiStore {
  save: KoiSave = loadSave();
  lastActionMessage = '';
  private tickTimer: ReturnType<typeof setInterval> | null = null;

  startTicking(): void {
    if (this.tickTimer) return;
    this.tick();
    this.tickTimer = setInterval(() => this.tick(), 30000);
  }

  stopTicking(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  tick(): void {
    if (!this.save.koi || !this.save.koi.isAlive) return;
    const nextKoi = tickKoi(this.save.koi);
    if (nextKoi === this.save.koi) return;
    this.save = updateBestStage({ ...this.save, koi: nextKoi }, nextKoi.growthStage);
    persistSave(this.save);
  }

  adoptKoi(name: string, skin: KoiSkin): void {
    const koi = createKoi(name, skin);
    this.save = {
      ...this.save,
      koi,
      totalRaised: this.save.totalRaised + 1,
      bestStageReached: Math.max(this.save.bestStageReached, 0) as KoiGrowthStage,
    };
    persistSave(this.save);
    this.lastActionMessage = `${koi.name} 来到了池塘！`;
  }

  feed(): { died: boolean; warning: boolean; message: string } {
    if (!this.save.koi) {
      return { died: false, warning: false, message: '还没有锦鲤呢~' };
    }
    const result = feedKoi(this.save.koi);
    this.save = updateBestStage({ ...this.save, koi: result.koi }, result.koi.growthStage);
    persistSave(this.save);
    this.lastActionMessage = result.message;
    return { died: result.died, warning: result.warning, message: result.message };
  }

  pet(): { ok: boolean; message: string } {
    if (!this.save.koi) {
      return { ok: false, message: '还没有锦鲤呢~' };
    }
    const result = petKoi(this.save.koi);
    this.save = updateBestStage({ ...this.save, koi: result.koi }, result.koi.growthStage);
    persistSave(this.save);
    this.lastActionMessage = result.message;
    return { ok: result.ok, message: result.message };
  }

  revive(name: string, skin: KoiSkin): void {
    const koi = createKoi(name, skin);
    this.save = {
      ...this.save,
      koi,
      totalRaised: this.save.totalRaised + 1,
    };
    persistSave(this.save);
    this.lastActionMessage = `${koi.name} 重新开始新生活！`;
  }

  getKoi(): KoiState | null {
    return this.save.koi;
  }

  getStatusMessage(): string {
    if (this.lastActionMessage) return this.lastActionMessage;
    const koi = this.save.koi;
    if (koi) return getStatusMessage(koi);
    return '欢迎来到锦鲤池塘！';
  }

  getStageName(stage: KoiGrowthStage): string {
    return getStageName(stage);
  }
}

export const koiStore = new KoiStore();

export { getStatusMessage, advanceKoiTime, forceKillKoi, forceStage };
