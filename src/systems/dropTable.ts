import type { DropEntry, DropRules, EnvironmentId, Fish, WeatherId } from '@/types';
import { loadJson, loadJsonArray } from '@/minigame/utils/loadJson';
import * as fishModule from '@/data/fish.json';
import * as dropRulesModule from '@/data/dropRules.json';

const fishList = loadJsonArray<Fish>(fishModule);
const dropRules = loadJson<DropRules>(dropRulesModule);

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

export function rollFish(
  environmentId: EnvironmentId,
  weatherId: WeatherId,
): Fish | null {
  const table = getDropTable(environmentId, weatherId);
  if (table.length === 0) return null;

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
