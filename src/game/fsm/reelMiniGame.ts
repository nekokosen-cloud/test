import type { Fish, FishRarity } from '@/types';

export interface ReelGameConfig {
  zoneSize: number;
  pointerSpeed: number;
  zoneDrift: number;
  durationMs: number;
  progressRate: number;
  decayRate: number;
}

export interface ReelGameState {
  pointer: number;
  zoneCenter: number;
  zoneSize: number;
  progress: number;
  elapsed: number;
  finished: boolean;
  success: boolean;
}

export interface ReelGameInstance {
  config: ReelGameConfig;
  state: ReelGameState;
}

const RARITY_CONFIG: Record<FishRarity, Partial<ReelGameConfig>> = {
  common: { zoneSize: 0.32, pointerSpeed: 0.0018, durationMs: 4500 },
  uncommon: { zoneSize: 0.26, pointerSpeed: 0.0022, durationMs: 5000 },
  rare: { zoneSize: 0.2, pointerSpeed: 0.0028, durationMs: 5500 },
  epic: { zoneSize: 0.15, pointerSpeed: 0.0034, durationMs: 6000 },
  legendary: { zoneSize: 0.11, pointerSpeed: 0.004, durationMs: 6500 },
};

const BASE: ReelGameConfig = {
  zoneSize: 0.25,
  pointerSpeed: 0.0025,
  zoneDrift: 0.00035,
  durationMs: 5000,
  progressRate: 0.006,
  decayRate: 0.003,
};

/** 在绿色区内约 2.5 秒可填满进度条 */
function calcProgressRate(durationMs: number): number {
  const fillSec = 2.5;
  return 1 / ((fillSec * 1000) / 16.67);
}

export function createReelGame(fish: Fish, zoneBonus = 0): ReelGameInstance {
  const rarityCfg = RARITY_CONFIG[fish.rarity] ?? {};
  const durationMs = rarityCfg.durationMs ?? BASE.durationMs;
  const progressRate = calcProgressRate(durationMs);
  const config: ReelGameConfig = {
    ...BASE,
    ...rarityCfg,
    durationMs,
    progressRate,
    decayRate: progressRate * 0.55,
    zoneSize: Math.min(0.4, (rarityCfg.zoneSize ?? BASE.zoneSize) + zoneBonus),
  };
  return {
    config,
    state: {
      pointer: 0.5,
      zoneCenter: 0.5,
      zoneSize: config.zoneSize,
      progress: 0,
      elapsed: 0,
      finished: false,
      success: false,
    },
  };
}

export function stepReelGame(
  game: ReelGameInstance,
  dtMs: number,
  holding: boolean,
): ReelGameInstance {
  const { config, state } = game;
  if (state.finished) return game;

  const dt = dtMs / 16.67;
  const next = { ...state };
  next.elapsed += dtMs;

  if (holding) {
    next.pointer = Math.min(1, next.pointer + config.pointerSpeed * dt * 1.4);
  } else {
    next.pointer = Math.max(0, next.pointer - config.pointerSpeed * dt * 0.9);
  }

  next.zoneCenter += Math.sin(next.elapsed * 0.002) * config.zoneDrift * dt;
  next.zoneCenter = Math.max(next.zoneSize / 2, Math.min(1 - next.zoneSize / 2, next.zoneCenter));

  const half = next.zoneSize / 2;
  const inZone = next.pointer >= next.zoneCenter - half && next.pointer <= next.zoneCenter + half;

  if (inZone) {
    next.progress = Math.min(1, next.progress + config.progressRate * dt);
  } else {
    next.progress = Math.max(0, next.progress - config.decayRate * dt);
  }

  if (next.progress >= 1) {
    next.finished = true;
    next.success = true;
  } else if (next.elapsed >= config.durationMs) {
    next.finished = true;
    next.success = false;
  }

  return { config, state: next };
}

export function needsReelMiniGame(fish: Fish): boolean {
  return fish.rarity !== 'common';
}
