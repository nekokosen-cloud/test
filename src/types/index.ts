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
