import type { KoiDeathReason, KoiGrowthStage, KoiSkin, KoiStageConfig, KoiState } from '@/types';
import koiStagesData from '@/data/koiStages.json';

const STAGES = koiStagesData as KoiStageConfig[];

const HUNGER_RATE = 0.5;
const FULLNESS_DECAY = 0.3;
const HAPPINESS_DECAY = 0.2;
const HEALTH_DAMAGE_RATE = 0.8;
const PET_COOLDOWN_MS = 3000;

const FEED_FULLNESS = 25;
const FEED_HUNGER = 30;
const FEED_HAPPINESS = 5;
const PET_HAPPINESS = 15;

const WARN_FULLNESS = 80;
const DANGER_FULLNESS = 95;
const DANGER_HEALTH_LOSS = 15;
const MAX_DANGER_FEEDS = 3;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function stageConfig(stage: KoiGrowthStage): KoiStageConfig {
  return STAGES.find((s) => s.stage === stage) ?? STAGES[0];
}

export function getStageName(stage: KoiGrowthStage): string {
  return stageConfig(stage).name;
}

export function getStageSize(stage: KoiGrowthStage): number {
  return stageConfig(stage).sizePx;
}

export function createKoi(name: string, skin: KoiSkin, now = Date.now()): KoiState {
  const iso = new Date(now).toISOString();
  return {
    id: `koi_${now}`,
    name: name.trim() || '小金',
    skin,
    hunger: 20,
    fullness: 30,
    happiness: skin === 'gold' ? 80 : 60,
    health: 100,
    growthStage: 0,
    ageHours: 0,
    feedCount: 0,
    dangerFeedCount: 0,
    everDangerFed: false,
    bornAt: iso,
    lastUpdatedAt: iso,
    lastPetAt: null,
    isAlive: true,
    deathReason: null,
    deathMessage: '',
  };
}

function markDead(koi: KoiState, reason: KoiDeathReason, message: string): KoiState {
  return {
    ...koi,
    isAlive: false,
    deathReason: reason,
    deathMessage: message,
    health: 0,
  };
}

function computeGrowthStage(koi: KoiState): KoiGrowthStage {
  let best: KoiGrowthStage = 0;
  for (const cfg of STAGES) {
    if (koi.ageHours < cfg.minAgeHours) continue;
    if (koi.feedCount < cfg.minFeedCount) continue;
    if (cfg.requiresGoodCare && (koi.happiness < 60 || koi.health < 70)) continue;
    if (cfg.requiresNeverDanger && koi.everDangerFed) continue;
    best = cfg.stage;
  }
  return best;
}

export function tickKoi(koi: KoiState, now = Date.now()): KoiState {
  if (!koi.isAlive) return koi;

  const last = new Date(koi.lastUpdatedAt).getTime();
  const elapsedMin = Math.max(0, (now - last) / 60000);
  if (elapsedMin <= 0) return koi;

  let next: KoiState = { ...koi };
  next.hunger = clamp(next.hunger + elapsedMin * HUNGER_RATE);
  next.fullness = clamp(next.fullness - elapsedMin * FULLNESS_DECAY);
  next.happiness = clamp(next.happiness - elapsedMin * HAPPINESS_DECAY);

  const bornMs = new Date(next.bornAt).getTime();
  next.ageHours = Math.max(0, (now - bornMs) / 3600000);

  if (next.hunger > 90 || next.fullness > 90) {
    next.health = clamp(next.health - elapsedMin * HEALTH_DAMAGE_RATE);
  }

  if (next.health <= 0) {
    const reason: KoiDeathReason = next.hunger >= 100 ? 'starved' : 'overfed';
    const message = reason === 'starved' ? '太久没喂食，饿坏了…' : '身体撑不住了…';
    next = markDead(next, reason, message);
  }

  next.growthStage = computeGrowthStage(next);
  next.lastUpdatedAt = new Date(now).toISOString();
  return next;
}

export interface FeedResult {
  koi: KoiState;
  message: string;
  died: boolean;
  warning: boolean;
}

export function feedKoi(koi: KoiState, now = Date.now()): FeedResult {
  if (!koi.isAlive) {
    return { koi, message: '它已经不在了…', died: false, warning: false };
  }

  let next = tickKoi(koi, now);
  const wasDanger = next.fullness >= DANGER_FULLNESS;
  const wasWarn = next.fullness >= WARN_FULLNESS;

  next = {
    ...next,
    fullness: clamp(next.fullness + FEED_FULLNESS),
    hunger: clamp(next.hunger - FEED_HUNGER),
    happiness: clamp(next.happiness + FEED_HAPPINESS),
    feedCount: next.feedCount + 1,
    lastUpdatedAt: new Date(now).toISOString(),
  };

  if (next.fullness >= DANGER_FULLNESS) {
    next.everDangerFed = true;
    next.dangerFeedCount = wasDanger ? next.dangerFeedCount + 1 : 1;
    next.health = clamp(next.health - DANGER_HEALTH_LOSS);
  } else {
    next.dangerFeedCount = 0;
  }

  if (next.fullness >= 100 || next.dangerFeedCount >= MAX_DANGER_FEEDS) {
    next = markDead(next, 'overfed', '喂太多，撑死了…');
    next.lastUpdatedAt = new Date(now).toISOString();
    return { koi: next, message: next.deathMessage, died: true, warning: true };
  }

  if (next.health <= 0) {
    next = markDead(next, 'overfed', '喂太多，撑死了…');
    next.lastUpdatedAt = new Date(now).toISOString();
    return { koi: next, message: next.deathMessage, died: true, warning: true };
  }

  next.growthStage = computeGrowthStage(next);

  let message = '它开心地吃掉了鱼粮！';
  let warning = false;
  if (next.fullness >= DANGER_FULLNESS) {
    message = '肚子已经鼓起来了，别再喂了！';
    warning = true;
  } else if (wasWarn || next.fullness >= WARN_FULLNESS) {
    message = '再喂就要撑到了！';
    warning = true;
  }

  return { koi: next, message, died: false, warning };
}

export interface PetResult {
  koi: KoiState;
  ok: boolean;
  message: string;
}

export function petKoi(koi: KoiState, now = Date.now()): PetResult {
  if (!koi.isAlive) {
    return { koi, ok: false, message: '它已经不在了…' };
  }

  let next = tickKoi(koi, now);
  const lastPet = next.lastPetAt ? new Date(next.lastPetAt).getTime() : 0;
  if (now - lastPet < PET_COOLDOWN_MS) {
    return { koi: next, ok: false, message: '它还需要休息一下~' };
  }

  next = {
    ...next,
    happiness: clamp(next.happiness + PET_HAPPINESS),
    lastPetAt: new Date(now).toISOString(),
    lastUpdatedAt: new Date(now).toISOString(),
  };
  next.growthStage = computeGrowthStage(next);

  return { koi: next, ok: true, message: '它开心地摆了摆尾巴！' };
}

export function getStatusMessage(koi: KoiState): string {
  if (!koi.isAlive) return koi.deathMessage || '它已经不在了…';
  if (koi.fullness >= DANGER_FULLNESS) return '肚子胀得圆圆的，看起来很难受…';
  if (koi.fullness >= WARN_FULLNESS) return '再喂就要撑到了！';
  if (koi.hunger >= 80) return '它饿得游不动了…';
  if (koi.happiness >= 70) return '它看起来很开心！';
  if (koi.health <= 30) return '它看起来不太健康…';
  if (koi.hunger >= 50) return '该喂食啦~';
  return '它在池塘里悠闲地游着。';
}

export function advanceKoiTime(koi: KoiState, hours: number, now = Date.now()): KoiState {
  const shifted = {
    ...koi,
    lastUpdatedAt: new Date(new Date(koi.lastUpdatedAt).getTime() - hours * 3600000).toISOString(),
  };
  return tickKoi(shifted, now);
}

export function forceKillKoi(koi: KoiState): KoiState {
  return markDead(
    { ...koi, fullness: 100 },
    'overfed',
    '喂太多，撑死了…',
  );
}

export function forceStage(koi: KoiState, stage: KoiGrowthStage): KoiState {
  const cfg = stageConfig(stage);
  return {
    ...koi,
    growthStage: stage,
    ageHours: cfg.minAgeHours,
    feedCount: cfg.minFeedCount,
  };
}

export { STAGES, WARN_FULLNESS, DANGER_FULLNESS, PET_COOLDOWN_MS };
