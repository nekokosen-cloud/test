import type { Fish, FishRarity } from '@/types';

const COIN_BY_RARITY: Record<FishRarity, number> = {
  common: 10,
  uncommon: 25,
  rare: 60,
  epic: 150,
  legendary: 400,
};

export function getFishCoinValue(fish: Fish, isNew: boolean): number {
  const base = COIN_BY_RARITY[fish.rarity] ?? 10;
  return isNew ? base * 2 : base;
}

export function formatCoins(coins: number): string {
  if (coins >= 10000) return `${(coins / 1000).toFixed(1)}k`;
  return String(coins);
}
