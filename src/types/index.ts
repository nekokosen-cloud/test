export type FishRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type EnvironmentId = 'lake' | 'river' | 'ocean' | 'pond';
export type WeatherId = 'sunny' | 'cloudy' | 'rainy' | 'foggy';
export type TimeOfDay = 'day' | 'dusk' | 'night';
export type FishingState =
  | 'idle'
  | 'casting'
  | 'waiting'
  | 'biting'
  | 'reeling'
  | 'caught'
  | 'escaped';

export interface Fish {
  id: string;
  name: string;
  rarity: FishRarity;
  environments: EnvironmentId[];
  weather: WeatherId[];
  timeOfDay: TimeOfDay[];
  biteWindowMs: number;
  color: string;
  accentColor: string;
  description: string;
}

export interface Environment {
  id: EnvironmentId;
  name: string;
  description: string;
  skyColor: string;
  waterColor: string;
  accentColor: string;
  maxRarity: FishRarity;
}

export interface Weather {
  id: WeatherId;
  name: string;
  skyOverlay: string;
  description: string;
}

export interface DropEntry {
  fishId: string;
  weight: number;
}

export interface DropRules {
  [environmentId: string]: {
    [weatherId: string]: DropEntry[];
  };
}

export interface CaughtFishRecord {
  count: number;
  firstCaughtAt: string;
}

export interface PlayerSave {
  caughtFish: Record<string, CaughtFishRecord>;
  totalCaught: number;
  settings: {
    vibration: boolean;
  };
}

export interface GameContext {
  environmentId: EnvironmentId;
  weatherId: WeatherId;
  timeOfDay: TimeOfDay;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FishingVisualState {
  state: FishingState;
  frame: number;
  bobberY: number;
  bobberX: number;
  splashIntensity: number;
  fishShadowAlpha: number;
  screenFlash: number;
  caughtFishId: string | null;
  isNewDiscovery: boolean;
}

export type KoiSkin = 'common' | 'gold';
export type KoiGrowthStage = 0 | 1 | 2 | 3 | 4;
export type KoiDeathReason = 'overfed' | 'starved';

export interface KoiState {
  id: string;
  name: string;
  skin: KoiSkin;
  hunger: number;
  fullness: number;
  happiness: number;
  health: number;
  growthStage: KoiGrowthStage;
  ageHours: number;
  feedCount: number;
  dangerFeedCount: number;
  everDangerFed: boolean;
  bornAt: string;
  lastUpdatedAt: string;
  lastPetAt: string | null;
  isAlive: boolean;
  deathReason: KoiDeathReason | null;
  deathMessage: string;
}

export interface KoiSave {
  koi: KoiState | null;
  totalRaised: number;
  bestStageReached: number;
}

export interface KoiStageConfig {
  stage: KoiGrowthStage;
  name: string;
  sizePx: number;
  minAgeHours: number;
  minFeedCount: number;
  requiresGoodCare?: boolean;
  requiresNeverDanger?: boolean;
}

export interface KoiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'food' | 'heart' | 'bubble';
}

export interface KoiVisualState {
  frame: number;
  petBurst: number;
  feedBurst: number;
  particles: KoiParticle[];
}
