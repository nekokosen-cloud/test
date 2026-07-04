import type { EnvironmentId, Fish, GearData, PlayerSave, TimeOfDay, WeatherId } from '@/types';
import { DEFAULT_SAVE, loadPlayerSave, persistPlayerSave } from '@/minigame/adapters/storage';
import { getFishCoinValue } from '@/systems/economy';
import { loadJson } from '@/minigame/utils/loadJson';
import * as gearModule from '@/data/gear.json';

const gearData = loadJson<GearData>(gearModule);

export class PlayerStore {
  save: PlayerSave = loadPlayerSave();

  get environmentId(): EnvironmentId {
    return this.save.environmentId;
  }

  get weatherId(): WeatherId {
    return this.save.weatherId;
  }

  get timeOfDay(): TimeOfDay {
    return this.save.timeOfDay;
  }

  get rodId(): string {
    return this.save.rodId;
  }

  get baitId(): string {
    return this.save.baitId;
  }

  private persist(): void {
    persistPlayerSave(this.save);
  }

  setEnvironment(id: EnvironmentId): void {
    this.save = { ...this.save, environmentId: id };
    this.persist();
  }

  setWeather(id: WeatherId): void {
    this.save = { ...this.save, weatherId: id };
    this.persist();
  }

  setTimeOfDay(id: TimeOfDay): void {
    this.save = { ...this.save, timeOfDay: id };
    this.persist();
  }

  cycleTimeOfDay(): void {
    const order: TimeOfDay[] = ['day', 'dusk', 'night'];
    const idx = order.indexOf(this.save.timeOfDay);
    this.setTimeOfDay(order[(idx + 1) % order.length]);
  }

  getRodZoneBonus(): number {
    const rod = gearData.rods.find((r) => r.id === this.save.rodId);
    return rod?.zoneBonus ?? 0;
  }

  getBaitCost(): number {
    const bait = gearData.baits.find((b) => b.id === this.save.baitId);
    return bait?.cost ?? 0;
  }

  canAfford(cost: number): boolean {
    return this.save.coins >= cost;
  }

  payForCast(): boolean {
    const cost = this.getBaitCost();
    if (cost <= 0) return true;
    if (!this.canAfford(cost)) return false;
    this.save = { ...this.save, coins: this.save.coins - cost };
    this.persist();
    return true;
  }

  buyRod(rodId: string): boolean {
    const rod = gearData.rods.find((r) => r.id === rodId);
    if (!rod) return false;
    const owned = this.save.ownedRodIds ?? ['basic'];
    const alreadyOwned = owned.includes(rodId);
    if (!alreadyOwned && rod.cost > 0 && !this.canAfford(rod.cost)) return false;

    const nextOwned = alreadyOwned ? owned : [...owned, rodId];
    this.save = {
      ...this.save,
      coins: !alreadyOwned && rod.cost > 0 ? this.save.coins - rod.cost : this.save.coins,
      rodId,
      ownedRodIds: nextOwned,
    };
    this.persist();
    return true;
  }

  selectBait(baitId: string): boolean {
    const bait = gearData.baits.find((b) => b.id === baitId);
    if (!bait) return false;
    this.save = { ...this.save, baitId };
    this.persist();
    return true;
  }

  recordCatch(fish: Fish): { isNew: boolean; coinsEarned: number } {
    const isNew = !this.save.caughtFish[fish.id];
    const now = new Date().toISOString();
    const existing = this.save.caughtFish[fish.id] ?? { count: 0, firstCaughtAt: now };
    const coinsEarned = getFishCoinValue(fish, isNew);
    const newStreak = this.save.currentStreak + 1;

    this.save = {
      ...this.save,
      totalCaught: this.save.totalCaught + 1,
      coins: this.save.coins + coinsEarned,
      currentStreak: newStreak,
      bestStreak: Math.max(this.save.bestStreak, newStreak),
      caughtFish: {
        ...this.save.caughtFish,
        [fish.id]: {
          count: existing.count + 1,
          firstCaughtAt: existing.firstCaughtAt,
        },
      },
    };

    this.persist();
    return { isNew, coinsEarned };
  }

  resetStreakOnEscape(): void {
    if (this.save.currentStreak === 0) return;
    this.save = { ...this.save, currentStreak: 0 };
    this.persist();
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

  getFirstCaughtAt(fishId: string): string | null {
    return this.save.caughtFish[fishId]?.firstCaughtAt ?? null;
  }

  toggleSound(): void {
    this.save = {
      ...this.save,
      settings: { ...this.save.settings, sound: !this.save.settings.sound },
    };
    this.persist();
  }

  reset(): void {
    this.save = { ...DEFAULT_SAVE };
    this.persist();
  }
}

export const playerStore = new PlayerStore();
export { gearData };
