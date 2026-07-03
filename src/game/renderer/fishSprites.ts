import type { Fish } from '@/types';

const GRID_W = 16;
const GRID_H = 12;

interface SpriteCtx {
  ctx: CanvasRenderingContext2D;
  ox: number;
  oy: number;
  ps: number;
  c: string;
  a: string;
  outline: string;
  silhouette: boolean;
}

function P(s: SpriteCtx, x: number, y: number, w = 1, h = 1, color?: string): void {
  if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return;
  let col = color ?? s.c;
  if (s.silhouette) {
    col = color === s.outline ? '#0A0A12' : '#252530';
  }
  s.ctx.fillStyle = col;
  s.ctx.fillRect(s.ox + x * s.ps, s.oy + y * s.ps, w * s.ps, h * s.ps);
}

function drawBg(s: SpriteCtx): void {
  const bg = s.silhouette ? '#1A1A22' : '#8EC8D8';
  P(s, 0, 0, GRID_W, GRID_H, bg);
  if (!s.silhouette) {
    P(s, 2, 9, 3, 1, '#7AB8C8');
    P(s, 10, 10, 4, 1, '#7AB8C8');
  }
}

function stdFish(s: SpriteCtx, spots = false, stripe = false): void {
  P(s, 5, 4, 7, 4);
  P(s, 4, 5, 1, 2, s.a);
  P(s, 3, 5, 1, 1, s.a);
  P(s, 6, 3, 4, 1);
  P(s, 6, 8, 4, 1);
  P(s, 12, 5, 2, 2, s.a);
  P(s, 11, 4, 1, 1, s.a);
  P(s, 11, 7, 1, 1, s.a);
  P(s, 13, 5, 1, 1, '#FFFFFF');
  P(s, 13, 5, 1, 1, s.outline);
  P(s, 8, 7, 2, 1, s.a);
  if (spots && !s.silhouette) {
    P(s, 7, 5, 1, 1, s.a);
    P(s, 9, 6, 1, 1, s.a);
  }
  if (stripe && !s.silhouette) {
    P(s, 7, 4, 1, 4, s.a);
    P(s, 9, 4, 1, 4, s.a);
  }
}

const FISH_DRAWERS: Record<string, (s: SpriteCtx) => void> = {
  crucian: (s) => {
    P(s, 5, 5, 6, 3);
    P(s, 4, 5, 1, 2, s.a);
    P(s, 6, 4, 3, 1);
    P(s, 6, 8, 3, 1);
    P(s, 11, 5, 2, 2, s.a);
    P(s, 12, 5, 1, 1, s.outline);
    P(s, 7, 6, 1, 1, s.a);
  },
  carp: (s) => stdFish(s, true),
  bass: (s) => {
    stdFish(s);
    P(s, 5, 4, 3, 1, s.a);
    if (!s.silhouette) P(s, 5, 4, 1, 1, '#2F4F2F');
  },
  gold_koi: (s) => {
    P(s, 4, 4, 8, 5);
    P(s, 3, 5, 1, 2, s.a);
    P(s, 2, 4, 1, 1, s.a);
    P(s, 2, 7, 1, 1, s.a);
    P(s, 12, 5, 2, 2, s.a);
    if (!s.silhouette) {
      P(s, 6, 5, 2, 1, '#FFFFFF');
      P(s, 8, 6, 2, 1, '#FF6600');
      P(s, 5, 7, 3, 1, '#FFD700');
    }
    P(s, 13, 5, 1, 1, '#FFFFFF');
    P(s, 13, 5, 1, 1, s.outline);
  },
  catfish: (s) => {
    P(s, 4, 5, 8, 3);
    P(s, 5, 4, 6, 1);
    P(s, 3, 6, 1, 2, s.a);
    P(s, 12, 5, 2, 2, s.a);
    P(s, 13, 5, 1, 1, s.outline);
    P(s, 6, 8, 1, 2, s.a);
    P(s, 9, 8, 1, 2, s.a);
    P(s, 5, 10, 2, 1, s.a);
    P(s, 9, 10, 2, 1, s.a);
  },
  trout: (s) => {
    stdFish(s, false, true);
    if (!s.silhouette) P(s, 7, 5, 4, 1, '#E85D4C');
  },
  salmon: (s) => {
    P(s, 4, 4, 9, 5);
    P(s, 3, 5, 1, 2, s.a);
    P(s, 13, 5, 2, 2, s.a);
    P(s, 12, 4, 1, 1, s.a);
    P(s, 12, 7, 1, 1, s.a);
    if (!s.silhouette) {
      P(s, 6, 5, 5, 2, '#C0392B');
      P(s, 7, 4, 3, 1, '#E07A5F');
    }
    P(s, 14, 5, 1, 1, s.outline);
  },
  eel: (s) => {
    P(s, 2, 6, 12, 2);
    P(s, 3, 5, 10, 1);
    P(s, 4, 7, 8, 1);
    P(s, 13, 5, 2, 1, s.a);
    P(s, 14, 6, 1, 1, s.outline);
    P(s, 1, 6, 1, 1, s.a);
  },
  minnow: (s) => {
    P(s, 6, 5, 5, 2);
    P(s, 5, 5, 1, 1, s.a);
    P(s, 11, 5, 1, 1, s.a);
    P(s, 12, 5, 1, 1, s.outline);
    if (!s.silhouette) P(s, 7, 5, 2, 1, '#FFFFFF');
  },
  pike: (s) => {
    P(s, 3, 5, 10, 2);
    P(s, 2, 5, 2, 1, s.a);
    P(s, 4, 4, 7, 1);
    P(s, 4, 7, 5, 1);
    P(s, 13, 4, 2, 1, s.a);
    P(s, 13, 7, 2, 1, s.a);
    P(s, 14, 5, 1, 1, s.outline);
    if (!s.silhouette) P(s, 1, 4, 1, 2, '#FFD700');
  },
  sardine: (s) => {
    P(s, 5, 5, 7, 2);
    P(s, 4, 5, 1, 1, s.a);
    P(s, 12, 5, 1, 1, s.a);
    P(s, 6, 4, 4, 1);
    if (!s.silhouette) P(s, 7, 5, 1, 1, '#FFFFFF');
    P(s, 13, 5, 1, 1, s.outline);
  },
  mackerel: (s) => {
    stdFish(s, false, true);
    if (!s.silhouette) {
      P(s, 6, 4, 1, 4, '#FFFFFF');
      P(s, 8, 4, 1, 4, '#FFFFFF');
      P(s, 10, 4, 1, 4, '#FFFFFF');
    }
  },
  tuna: (s) => {
    P(s, 3, 4, 10, 4);
    P(s, 2, 5, 1, 2, s.a);
    P(s, 13, 4, 2, 2, s.a);
    P(s, 5, 3, 6, 1, s.a);
    P(s, 14, 5, 1, 1, s.outline);
    if (!s.silhouette) P(s, 6, 5, 4, 2, '#1A3A6A');
  },
  octopus: (s) => {
    P(s, 5, 3, 6, 4);
    P(s, 4, 4, 1, 2);
    P(s, 11, 4, 1, 2);
    P(s, 6, 7, 1, 3, s.a);
    P(s, 8, 7, 1, 3, s.a);
    P(s, 10, 7, 1, 3, s.a);
    P(s, 4, 7, 1, 2, s.a);
    P(s, 12, 7, 1, 2, s.a);
    P(s, 3, 8, 1, 2, s.a);
    P(s, 13, 8, 1, 2, s.a);
    P(s, 7, 2, 1, 1, s.outline);
    P(s, 9, 2, 1, 1, s.outline);
  },
  starfish: (s) => {
    P(s, 7, 5, 2, 2);
    P(s, 7, 2, 2, 2);
    P(s, 7, 8, 2, 2);
    P(s, 4, 5, 2, 2);
    P(s, 10, 5, 2, 2);
    if (!s.silhouette) {
      P(s, 7, 3, 1, 1, '#FFD93D');
      P(s, 8, 6, 1, 1, '#FFD93D');
    }
  },
  goldfish: (s) => {
    P(s, 5, 4, 6, 4);
    P(s, 4, 5, 1, 2, s.a);
    P(s, 3, 4, 1, 2, s.a);
    P(s, 11, 5, 2, 2, s.a);
    if (!s.silhouette) P(s, 6, 5, 2, 2, '#FFAA44');
    P(s, 12, 5, 1, 1, s.outline);
  },
  frog: (s) => {
    P(s, 5, 5, 6, 3);
    P(s, 4, 4, 2, 2);
    P(s, 10, 4, 2, 2);
    P(s, 6, 8, 2, 2, s.a);
    P(s, 9, 8, 2, 2, s.a);
    if (!s.silhouette) {
      P(s, 5, 4, 1, 1, s.outline);
      P(s, 11, 4, 1, 1, s.outline);
      P(s, 7, 6, 2, 1, '#4A8040');
    }
  },
  turtle: (s) => {
    P(s, 4, 4, 8, 5);
    P(s, 5, 3, 6, 1, s.a);
    P(s, 3, 6, 1, 2, s.a);
    P(s, 12, 6, 1, 2, s.a);
    P(s, 5, 9, 2, 1, s.a);
    P(s, 9, 9, 2, 1, s.a);
    if (!s.silhouette) {
      P(s, 6, 5, 4, 3, '#4A6B3A');
      P(s, 7, 6, 2, 1, '#6B8E5A');
    }
    P(s, 6, 3, 1, 1, s.outline);
  },
  ghost_fish: (s) => {
    stdFish(s);
    if (!s.silhouette) {
      s.ctx.globalAlpha = 0.65;
      P(s, 5, 4, 7, 4, '#A0C8E0');
      s.ctx.globalAlpha = 1;
      P(s, 4, 3, 1, 1, '#FFFFFF');
      P(s, 10, 3, 1, 1, '#FFFFFF');
    }
  },
  rainbow_trout: (s) => {
    stdFish(s);
    if (!s.silhouette) {
      P(s, 6, 5, 1, 2, '#FF6688');
      P(s, 8, 4, 1, 3, '#FFD700');
      P(s, 10, 5, 1, 2, '#88CCFF');
    }
  },
  sturgeon: (s) => {
    P(s, 2, 5, 11, 3);
    P(s, 1, 5, 2, 1, s.a);
    P(s, 0, 5, 1, 1, s.a);
    P(s, 13, 4, 2, 3, s.a);
    P(s, 4, 4, 7, 1);
    P(s, 5, 8, 5, 1);
    if (!s.silhouette) P(s, 3, 5, 2, 1, '#505860');
    P(s, 14, 5, 1, 1, s.outline);
  },
  clownfish: (s) => {
    P(s, 5, 4, 6, 4);
    P(s, 4, 5, 1, 2, s.a);
    P(s, 11, 5, 2, 2, s.a);
    if (!s.silhouette) {
      P(s, 6, 5, 4, 1, '#FFFFFF');
      P(s, 7, 6, 3, 2, '#FFFFFF');
      P(s, 5, 4, 2, 1, '#FFFFFF');
    }
    P(s, 12, 5, 1, 1, s.outline);
  },
  moon_jelly: (s) => {
    P(s, 4, 3, 8, 4);
    P(s, 5, 2, 6, 1);
    P(s, 5, 7, 1, 3, s.a);
    P(s, 7, 7, 1, 3, s.a);
    P(s, 9, 7, 1, 3, s.a);
    P(s, 11, 7, 1, 2, s.a);
    if (!s.silhouette) {
      P(s, 6, 4, 2, 1, '#FFFFFF');
      P(s, 9, 4, 1, 1, '#FFFFFF');
      s.ctx.globalAlpha = 0.8;
      P(s, 4, 3, 8, 4, '#C0E0FF');
      s.ctx.globalAlpha = 1;
    }
  },
  lotus_carp: (s) => {
    stdFish(s);
    if (!s.silhouette) {
      P(s, 2, 9, 3, 1, '#4A8A5A');
      P(s, 11, 9, 3, 1, '#FF88AA');
      P(s, 12, 8, 2, 1, '#FF88AA');
    }
  },
  king_crab: (s) => {
    P(s, 5, 5, 6, 3);
    P(s, 4, 4, 2, 1, s.a);
    P(s, 10, 4, 2, 1, s.a);
    P(s, 3, 5, 1, 2, s.a);
    P(s, 12, 5, 1, 2, s.a);
    P(s, 2, 6, 1, 1, s.a);
    P(s, 13, 6, 1, 1, s.a);
    P(s, 6, 3, 1, 1, s.a);
    P(s, 9, 3, 1, 1, s.a);
    if (!s.silhouette) P(s, 6, 6, 1, 1, '#882211');
    P(s, 7, 5, 1, 1, s.outline);
  },
  mudskipper: (s) => {
    P(s, 4, 6, 8, 2);
    P(s, 5, 5, 6, 1);
    P(s, 3, 6, 1, 1, s.a);
    P(s, 12, 6, 1, 1, s.a);
    P(s, 6, 8, 2, 1, s.a);
    P(s, 9, 8, 2, 1, s.a);
    P(s, 8, 4, 2, 1, s.a);
    P(s, 13, 5, 1, 1, s.outline);
  },
  ice_fish: (s) => {
    stdFish(s);
    if (!s.silhouette) {
      s.ctx.globalAlpha = 0.55;
      P(s, 4, 3, 9, 5, '#B0E8FF');
      s.ctx.globalAlpha = 1;
      P(s, 5, 4, 1, 1, '#FFFFFF');
      P(s, 8, 3, 1, 1, '#FFFFFF');
      P(s, 11, 5, 1, 1, '#FFFFFF');
      P(s, 7, 7, 2, 1, '#60C0E0');
    }
  },
};

export interface DrawFishOptions {
  silhouette?: boolean;
  showBackground?: boolean;
}

export function drawFishPixelArt(
  ctx: CanvasRenderingContext2D,
  fish: Fish,
  canvasSize: number,
  options: DrawFishOptions = {},
): void {
  const { silhouette = false, showBackground = true } = options;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  const ps = Math.max(1, Math.floor(canvasSize / GRID_W));
  const drawW = GRID_W * ps;
  const drawH = GRID_H * ps;
  const ox = Math.floor((canvasSize - drawW) / 2);
  const oy = Math.floor((canvasSize - drawH) / 2);

  const s: SpriteCtx = {
    ctx,
    ox,
    oy,
    ps,
    c: fish.color,
    a: fish.accentColor,
    outline: '#1A1A2E',
    silhouette,
  };

  if (showBackground) drawBg(s);

  const drawer = FISH_DRAWERS[fish.id] ?? ((sc) => stdFish(sc));
  drawer(s);

  if (!silhouette && (fish.rarity === 'legendary' || fish.rarity === 'epic')) {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(ox, oy, drawW, drawH);
    ctx.globalAlpha = 1;
  }
}

const dataUrlCache = new Map<string, string>();

export function getFishSpriteDataUrl(
  fish: Fish,
  size: number,
  silhouette = false,
): string {
  const key = `${fish.id}_${size}_${silhouette}`;
  const cached = dataUrlCache.get(key);
  if (cached) return cached;

  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  drawFishPixelArt(ctx, fish, size, { silhouette, showBackground: true });
  const url = canvas.toDataURL('image/png');
  dataUrlCache.set(key, url);
  return url;
}

export function getRarityBorderColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '#8B7355',
    uncommon: '#5FA088',
    rare: '#6BB5E0',
    epic: '#9B59B6',
    legendary: '#E8A838',
  };
  return colors[rarity] ?? '#8B7355';
}

export { GRID_W, GRID_H };
