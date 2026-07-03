import type { Fish, KoiParticle, KoiState } from '@/types';
import { drawFishPixelArt } from '@/game/renderer/fishSprites';
import { getStageSize } from '@/game/koi/koiSimulation';
import { drawPixelRect } from '@/game/renderer/pixelRenderer';

const PIXEL = 4;

const KOI_FISH: Record<string, Fish> = {
  gold: {
    id: 'gold_koi',
    name: '金锦鲤',
    rarity: 'legendary',
    environments: ['pond'],
    weather: ['sunny'],
    timeOfDay: ['day'],
    biteWindowMs: 1200,
    color: '#FFB347',
    accentColor: '#FF6600',
    description: '',
  },
  common: {
    id: 'common_koi',
    name: '红白锦鲤',
    rarity: 'uncommon',
    environments: ['pond'],
    weather: ['sunny'],
    timeOfDay: ['day'],
    biteWindowMs: 1200,
    color: '#FFFFFF',
    accentColor: '#E74C3C',
    description: '',
  },
};

export function getKoiFish(koi: KoiState): Fish {
  return KOI_FISH[koi.skin] ?? KOI_FISH.common;
}

export function drawPondBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
): number {
  const waterY = Math.floor(height * 0.22);

  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, width, waterY);

  ctx.fillStyle = '#6BB58A';
  ctx.fillRect(0, waterY - 8, width, 12);

  ctx.fillStyle = '#3A7A5A';
  for (let x = 0; x < width; x += 24) {
    const h = 16 + (x % 48 === 0 ? 8 : 0);
    drawPixelRect(ctx, x, waterY - h - 4, 8, h, '#4A8A6A');
  }

  ctx.fillStyle = '#2E6B8A';
  ctx.fillRect(0, waterY, width, height - waterY);

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    for (let x = 0; x <= width; x += 4) {
      const y = waterY + 10 + i * 14 + Math.sin((x + frame * 1.5 + i * 40) * 0.04) * 2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  drawPixelRect(ctx, 20, waterY + 30, 40, 8, '#5A9A7A');
  drawPixelRect(ctx, width - 70, waterY + 50, 50, 10, '#5A9A7A');
  drawPixelRect(ctx, width / 2 - 20, waterY + 80, 30, 6, '#4A8A6A');

  return waterY;
}

export interface KoiDrawParams {
  koi: KoiState;
  width: number;
  height: number;
  waterY: number;
  frame: number;
  petBurst: number;
  feedBurst: number;
}

export function getKoiPosition(params: KoiDrawParams): { x: number; y: number; flip: boolean } {
  const { width, height, waterY, frame, koi, petBurst } = params;
  const t = frame * 0.02 * (koi.happiness >= 70 ? 1.2 : 1);
  const cx = width * 0.5;
  const cy = waterY + (height - waterY) * 0.45;
  const rx = width * 0.28;
  const ry = (height - waterY) * 0.22;
  const jump = petBurst > 0 ? -Math.abs(Math.sin(petBurst * 0.3)) * 18 : 0;
  const x = cx + Math.sin(t) * rx;
  const y = cy + Math.sin(t * 2) * ry * 0.5 + jump;
  const flip = Math.cos(t) < 0;
  return { x, y, flip };
}

export function drawKoi(
  ctx: CanvasRenderingContext2D,
  params: KoiDrawParams,
): { x: number; y: number; size: number } {
  const { koi, frame, feedBurst } = params;
  const pos = getKoiPosition(params);
  let size = getStageSize(koi.growthStage);
  if (koi.fullness >= 80) size = Math.floor(size * 1.12);
  if (feedBurst > 0) size = Math.floor(size * (1 + feedBurst * 0.01));

  const fish = getKoiFish(koi);
  ctx.save();
  ctx.translate(pos.x, pos.y);
  if (koi.isAlive === false) {
    ctx.rotate(Math.PI);
    ctx.globalAlpha = 0.75;
  } else if (pos.flip) {
    ctx.scale(-1, 1);
  }
  if (koi.health <= 30 && koi.isAlive) {
    ctx.filter = 'grayscale(0.6)';
  }
  drawFishPixelArt(ctx, fish, size, { silhouette: false, showBackground: false });
  ctx.restore();

  if (koi.growthStage >= 4 && koi.isAlive) {
    ctx.globalAlpha = 0.2 + Math.sin(frame * 0.1) * 0.1;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(pos.x - size / 2 - 4, pos.y - size / 2 - 4, size + 8, size + 8);
    ctx.globalAlpha = 1;
  }

  return { x: pos.x, y: pos.y, size };
}

export function spawnFoodParticles(x: number, y: number): KoiParticle[] {
  return Array.from({ length: 8 }, (_, i) => ({
    x: x + (Math.random() - 0.5) * 20,
    y: y - 20,
    vx: (Math.random() - 0.5) * 2,
    vy: 1 + Math.random() * 2,
    life: 40 + Math.random() * 20,
    maxLife: 60,
    color: '#E8A838',
    size: 3,
    type: 'food' as const,
  }));
}

export function spawnHeartParticles(x: number, y: number): KoiParticle[] {
  return Array.from({ length: 5 }, () => ({
    x: x + (Math.random() - 0.5) * 16,
    y: y - 10,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -1.5 - Math.random(),
    life: 30 + Math.random() * 20,
    maxLife: 50,
    color: '#FF6B8A',
    size: 4,
    type: 'heart' as const,
  }));
}

export function spawnBubbleParticle(x: number, y: number): KoiParticle {
  return {
    x,
    y: y - 20,
    vx: 0,
    vy: -0.8,
    life: 50,
    maxLife: 50,
    color: '#FFFFFF',
    size: 3,
    type: 'bubble',
  };
}

export function updateKoiParticles(particles: KoiParticle[]): KoiParticle[] {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + (p.type === 'food' ? 0.05 : 0),
      life: p.life - 1,
    }))
    .filter((p) => p.life > 0);
}

export function drawKoiParticles(ctx: CanvasRenderingContext2D, particles: KoiParticle[]): void {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    if (p.type === 'heart') {
      ctx.fillStyle = p.color;
      drawPixelRect(ctx, p.x, p.y, p.size, p.size, p.color);
      drawPixelRect(ctx, p.x - p.size, p.y, p.size, p.size, p.color);
      drawPixelRect(ctx, p.x + p.size, p.y, p.size, p.size, p.color);
    } else if (p.type === 'bubble') {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.size, p.size);
    } else {
      drawPixelRect(ctx, p.x, p.y, p.size, p.size, p.color);
    }
  }
  ctx.globalAlpha = 1;
}

export function isTapOnKoi(
  tapX: number,
  tapY: number,
  params: KoiDrawParams,
): boolean {
  const pos = getKoiPosition(params);
  const size = getStageSize(params.koi.growthStage);
  const half = size / 2 + 10;
  return (
    tapX >= pos.x - half &&
    tapX <= pos.x + half &&
    tapY >= pos.y - half &&
    tapY <= pos.y + half
  );
}

export { PIXEL };
