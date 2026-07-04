import type { DropEntry, DropRules, EnvironmentId, Fish, FishRarity, TimeOfDay, WeatherId } from '@/types';
import { loadJson, loadJsonArray } from '@/minigame/utils/loadJson';
import * as fishModule from '@/data/fish.json';
import * as dropRulesModule from '@/data/dropRules.json';
import * as gearModule from '@/data/gear.json';

const fishList = loadJsonArray<Fish>(fishModule);
const dropRules = loadJson<DropRules>(dropRulesModule);

interface GearData {
  baits: { id: string; rareMultiplier: number }[];
}

const gearData = loadJson<GearData>(gearModule);

const RARE_PLUS: FishRarity[] = ['rare', 'epic', 'legendary'];

export interface RollFishOptions {
  timeOfDay?: TimeOfDay;
  baitId?: string;
}

export function getFishById(id: string): Fish | undefined {
  return fishList.find((f) => f.id === id);
}

export function getAllFish(): Fish[] {
  return fishList;
}

export function getDropTable(
  environmentId: EnvironmentId,
  weatherId: WeatherId,
): DropEntry[] {
  return dropRules[environmentId]?.[weatherId] ?? [];
}

function getBaitMultiplier(baitId: string): number {
  const bait = gearData.baits.find((b) => b.id === baitId);
  return bait?.rareMultiplier ?? 1;
}

function filterByTimeOfDay(entries: DropEntry[], timeOfDay: TimeOfDay): DropEntry[] {
  const filtered = entries.filter((entry) => {
    const fish = getFishById(entry.fishId);
    return fish && fish.timeOfDay.includes(timeOfDay);
  });
  return filtered.length > 0 ? filtered : entries;
}

function applyBaitWeights(entries: DropEntry[], baitId: string): DropEntry[] {
  const mult = getBaitMultiplier(baitId);
  if (mult <= 1) return entries;
  return entries.map((entry) => {
    const fish = getFishById(entry.fishId);
    if (fish && RARE_PLUS.includes(fish.rarity)) {
      return { ...entry, weight: entry.weight * mult };
    }
    return entry;
  });
}

export function rollFish(
  environmentId: EnvironmentId,
  weatherId: WeatherId,
  options: RollFishOptions = {},
): Fish | null {
  const timeOfDay = options.timeOfDay ?? 'day';
  const baitId = options.baitId ?? 'none';

  let table = getDropTable(environmentId, weatherId);
  if (table.length === 0) return null;

  table = filterByTimeOfDay(table, timeOfDay);
  table = applyBaitWeights(table, baitId);

  const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) {
      return getFishById(entry.fishId) ?? null;
    }
  }

  const last = table[table.length - 1];
  return getFishById(last.fishId) ?? null;
}

export function getFishForEnvironment(envId: EnvironmentId): Fish[] {
  return fishList.filter((f) => f.environments.includes(envId));
}

export function getFishForWeather(weatherId: WeatherId): Fish[] {
  return fishList.filter((f) => f.weather.includes(weatherId));
}

export function getRarityLabel(rarity: string): string {
  const labels: Record<string, string> = {
    common: '普通',
    uncommon: '少见',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
  };
  return labels[rarity] ?? rarity;
}

export function getRarityStars(rarity: string): number {
  const stars: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
  };
  return stars[rarity] ?? 1;
}

export const RARITY_ORDER: Record<FishRarity, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  uncommon: 3,
  common: 4,
};
