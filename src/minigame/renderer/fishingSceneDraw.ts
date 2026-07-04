import type { Fish, FishRarity, Particle, TimeOfDay, Weather } from '@/types';
import {
  drawEnvironmentDecor,
  drawFishShadow,
  drawFishSprite,
  drawParticles,
  drawPixelRect,
  drawScreenFlash,
  drawWaterSurface,
  PIXEL,
  spawnSplashParticles,
  updateParticles,
} from '@/game/renderer/pixelRenderer';
import type { SceneMetrics } from '@/minigame/layout/screenLayout';

export { spawnSplashParticles, updateParticles };

const TIME_OVERLAY: Record<TimeOfDay, string> = {
  day: 'rgba(0,0,0,0)',
  dusk: 'rgba(255,120,60,0.22)',
  night: 'rgba(20,30,80,0.45)',
};

const RARITY_FLASH: Record<FishRarity, string> = {
  common: 'rgba(255,255,255,0.35)',
  uncommon: 'rgba(200,255,200,0.4)',
  rare: 'rgba(100,200,255,0.45)',
  epic: 'rgba(200,100,255,0.5)',
  legendary: 'rgba(255,215,0,0.65)',
};

export function drawSkyScaled(
  ctx: CanvasRenderingContext2D,
  metrics: SceneMetrics,
  skyColor: string,
  weather: Weather,
  frame: number,
  safeRight: number,
  timeOfDay: TimeOfDay = 'day',
): void {
  const { width, waterY } = metrics;
  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, width, waterY);

  if (timeOfDay === 'night') {
    ctx.fillStyle = 'rgba(255,255,200,0.85)';
    const moonSize = Math.floor(14 * metrics.scale);
    ctx.fillRect(width * 0.15, waterY * 0.1, moonSize, moonSize);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      const sx = (i * 47 + 20) % width;
      const sy = (i * 31 + 10) % (waterY * 0.5);
      ctx.fillRect(sx, sy, 2, 2);
    }
  }

  if (weather.id === 'cloudy' || weather.id === 'rainy' || weather.id === 'foggy') {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    const off = frame * 0.3;
    drawCloud(ctx, 40 + off % (width * 0.5), waterY * 0.18, 36);
    drawCloud(ctx, width * 0.45 + off * 0.5 % (width * 0.4), waterY * 0.26, 28);
  }

  if (weather.id === 'sunny' && timeOfDay !== 'night') {
    const sunSize = Math.floor(20 * metrics.scale);
    const sunX = Math.min(width - safeRight - sunSize - 8, width * 0.72);
    const sunY = Math.floor(waterY * (timeOfDay === 'dusk' ? 0.28 : 0.12));
    ctx.fillStyle = timeOfDay === 'dusk' ? '#FF8844' : '#FFD700';
    ctx.fillRect(sunX, sunY, sunSize, sunSize);
    ctx.fillStyle = 'rgba(255,220,100,0.2)';
    ctx.fillRect(sunX - 6, sunY - 6, sunSize + 12, sunSize + 12);
  }

  if (weather.skyOverlay) {
    ctx.fillStyle = weather.skyOverlay;
    ctx.fillRect(0, 0, width, waterY);
  }

  const timeOverlay = TIME_OVERLAY[timeOfDay];
  if (timeOverlay !== 'rgba(0,0,0,0)') {
    ctx.fillStyle = timeOverlay;
    ctx.fillRect(0, 0, width, waterY);
  }

  if (weather.id === 'rainy') {
    ctx.strokeStyle = timeOfDay === 'night' ? 'rgba(140,160,255,0.6)' : 'rgba(180,200,255,0.5)';
    ctx.lineWidth = 1;
    const rainCount = timeOfDay === 'night' ? 32 : 24;
    for (let i = 0; i < rainCount; i++) {
      const rx = (i * 37 + frame * 3) % width;
      const ry = (i * 23 + frame * 5) % waterY;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 3, ry + 8);
      ctx.stroke();
    }
  }

  if (weather.id === 'foggy') {
    const fogAlpha = timeOfDay === 'night' ? 0.45 : 0.3;
    ctx.fillStyle = `rgba(220,230,240,${fogAlpha})`;
    for (let i = 0; i < 4; i++) {
      const fx = (i * 70 + frame * 0.2) % (width + 50) - 20;
      ctx.fillRect(fx, waterY * 0.35 + i * 12, 90, 16);
    }
    ctx.fillStyle = `rgba(200,210,220,${fogAlpha * 0.6})`;
    ctx.fillRect(0, waterY * 0.5, width, waterY * 0.5);
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const s = PIXEL;
  ctx.fillRect(x, y, size, s * 2);
  ctx.fillRect(x - s * 2, y + s, s * 2, s * 2);
  ctx.fillRect(x + size, y + s, s * 3, s * 2);
}

export function drawFisherAndRod(
  ctx: CanvasRenderingContext2D,
  m: SceneMetrics,
  frame: number,
  castShake = 0,
): void {
  const s = Math.max(3, Math.floor(PIXEL * m.scale));
  const shakeX = castShake ? Math.sin(frame * 0.5) * castShake : 0;
  const { fisherX, fisherY, bobberX, bobberY } = m;
  const fx = fisherX + shakeX;

  drawPixelRect(ctx, fx, fisherY, s * 2, s * 5, '#3E2731');
  drawPixelRect(ctx, fx - s * 0.5, fisherY - s * 2, s * 3, s * 2, '#E8A838');
  drawPixelRect(ctx, fx, fisherY - s * 3, s * 2, s, '#FFDAB0');

  const handX = fx + s * 2;
  const handY = fisherY + s * 1.5;
  const rodEndX = bobberX;
  const rodEndY = bobberY - Math.floor(10 * m.scale);
  const sway = Math.sin(frame * 0.1) * 2;

  ctx.strokeStyle = '#8B6040';
  ctx.lineWidth = Math.max(2, Math.floor(2 * m.scale));
  ctx.beginPath();
  ctx.moveTo(handX, handY);
  try {
    ctx.quadraticCurveTo(m.rodTipX, m.rodTipY + sway, rodEndX, rodEndY);
  } catch {
    ctx.lineTo(m.rodTipX, m.rodTipY + sway);
    ctx.lineTo(rodEndX, rodEndY);
  }
  ctx.stroke();
}

export function drawBobberScaled(
  ctx: CanvasRenderingContext2D,
  m: SceneMetrics,
  biting: boolean,
  frame: number,
  escaped = false,
): void {
  const s = Math.max(3, Math.floor(PIXEL * m.scale));
  const bob = biting
    ? Math.sin(frame * 0.8) * 5
    : escaped
      ? -Math.abs(Math.sin(frame * 0.25)) * 12
      : Math.sin(frame * 0.15) * 2;
  const bx = m.bobberX;
  const by = m.bobberY + bob;
  const sink = biting ? 14 : escaped ? -8 : 0;
  const lineTopY = m.bobberY - Math.floor(10 * m.scale) + Math.sin(frame * 0.1) * 2;

  ctx.strokeStyle = '#3E2731';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx, lineTopY);
  ctx.lineTo(bx, by - s + sink);
  ctx.stroke();

  drawPixelRect(ctx, bx - s, by + sink, s * 2, s * 2.5, '#E74C3C');
  drawPixelRect(ctx, bx - s, by + s * 2.5 + sink, s * 2, s * 1.5, '#FFFFFF');
}

export function drawFishingScene(
  ctx: CanvasRenderingContext2D,
  m: SceneMetrics,
  envId: string,
  skyColor: string,
  waterColor: string,
  weather: Weather,
  frame: number,
  safeRight: number,
  fishingState: string,
  caughtFish: Fish | null,
  particles: Particle[],
  screenFlash: number,
  timeOfDay: TimeOfDay = 'day',
  escapeAnim = 0,
): void {
  drawSkyScaled(ctx, m, skyColor, weather, frame, safeRight, timeOfDay);
  drawEnvironmentDecor(ctx, envId, m.width, m.waterY);
  drawWaterSurface(ctx, m.width, m.waterY, waterColor, frame);

  if (fishingState === 'waiting' || fishingState === 'biting') {
    drawFishShadow(ctx, m.bobberX, m.waterY + 16, fishingState === 'biting' ? 0.85 : 0.25, frame);
  }

  const castShake = fishingState === 'casting' ? 2 : 0;
  drawFisherAndRod(ctx, m, frame, castShake);

  const showBobber = ['waiting', 'biting', 'reeling', 'reeling_game', 'escaped'].includes(fishingState);
  if (showBobber) {
    drawBobberScaled(
      ctx,
      m,
      fishingState === 'biting',
      frame + escapeAnim * 10,
      fishingState === 'escaped',
    );
  }

  if (fishingState === 'caught' && caughtFish) {
    const bounce = Math.abs(Math.sin(frame * 0.15)) * 10;
    drawFishSprite(ctx, m.bobberX - 20, m.bobberY - 50 - bounce, caughtFish, 1.2 * m.scale);
  }

  drawParticles(ctx, particles);

  const flashColor = caughtFish && fishingState === 'caught'
    ? RARITY_FLASH[caughtFish.rarity]
    : undefined;
  drawScreenFlash(ctx, m.width, m.height, screenFlash, flashColor);
}

export function spawnCatchParticles(
  x: number,
  y: number,
  rarity: FishRarity,
): Particle[] {
  const count = rarity === 'legendary' ? 28 : rarity === 'epic' ? 20 : rarity === 'rare' ? 14 : 8;
  const color = rarity === 'legendary' ? '#FFD700' : rarity === 'epic' ? '#C060FF' : '#FFFFFF';
  return spawnSplashParticles(x, y, count).map((p) => ({ ...p, color }));
}

export function spawnCastSplash(x: number, y: number): Particle[] {
  return spawnSplashParticles(x, y, 10);
}
