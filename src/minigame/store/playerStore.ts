import type { EnvironmentId, Fish, PlayerSave, WeatherId } from '@/types';
import { DEFAULT_SAVE, loadPlayerSave, persistPlayerSave } from '@/minigame/adapters/storage';

export class PlayerStore {
  save: PlayerSave = loadPlayerSave();
  environmentId: EnvironmentId = 'lake';
  weatherId: WeatherId = 'sunny';

  setEnvironment(id: EnvironmentId): void {
    this.environmentId = id;
  }

  setWeather(id: WeatherId): void {
    this.weatherId = id;
  }

  recordCatch(fish: Fish): boolean {
    const isNew = !this.save.caughtFish[fish.id];
    const now = new Date().toISOString();
    const existing = this.save.caughtFish[fish.id] ?? { count: 0, firstCaughtAt: now };

    this.save = {
      ...this.save,
      totalCaught: this.save.totalCaught + 1,
      caughtFish: {
        ...this.save.caughtFish,
        [fish.id]: {
          count: existing.count + 1,
          firstCaughtAt: existing.firstCaughtAt,
        },
      },
    };

    persistPlayerSave(this.save);
    return isNew;
  }

  isDiscovered(fishId: string): boolean {
    return !!this.save.caughtFish[fishId];
  }

  getCaughtCount(fishId: string): number {
    return this.save.caughtFish[fishId]?.count ?? 0;
  }

  getDiscoveredCount(): number {
    return Object.keys(this.save.caughtFish).length;
  }

  reset(): void {
    this.save = { ...DEFAULT_SAVE };
    persistPlayerSave(this.save);
  }
}

export const playerStore = new PlayerStore();
