import type { KoiState } from '@/types';
import { drawTopDownKoi } from '@/game/koi/koiTopDownSprites';
import { getStageSize } from '@/game/koi/koiSimulation';
import { drawPixelRect } from '@/game/renderer/pixelRenderer';

export interface KoiSwimState {
  x: number;
  y: number;
  angle: number;
  wigglePhase: number;
  mouthPush: number;
}

export function createKoiSwim(w: number, h: number): KoiSwimState {
  return {
    x: w * 0.5,
    y: h * 0.55,
    angle: Math.random() * Math.PI * 2,
    wigglePhase: 0,
    mouthPush: 0,
  };
}

export function updateKoiSwim(
  swim: KoiSwimState,
  w: number,
  h: number,
  dt: number,
  feedBurst: number,
): KoiSwimState {
  const speed = feedBurst > 0 ? 1.8 : 0.9;
  const margin = 40;
  let { x, y, angle, wigglePhase, mouthPush } = swim;

  x += Math.cos(angle) * speed * (dt / 16);
  y += Math.sin(angle) * speed * (dt / 16);
  wigglePhase += dt * 0.008;
  mouthPush = feedBurst > 0 ? Math.sin(wigglePhase * 3) * 1.5 + 1 : 0;

  if (x < margin || x > w - margin) {
    angle = Math.PI - angle;
    x = Math.max(margin, Math.min(w - margin, x));
  }
  if (y < h * 0.2 || y > h * 0.85) {
    angle = -angle;
    y = Math.max(h * 0.2, Math.min(h * 0.85, y));
  }

  if (Math.random() < 0.008) {
    angle += (Math.random() - 0.5) * 1.2;
  }

  return { x, y, angle, wigglePhase, mouthPush };
}

export function drawKoiPond(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: number,
): void {
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, w, h * 0.15);

  ctx.fillStyle = '#3A7A5A';
  ctx.fillRect(0, h * 0.12, w, h * 0.08);

  const grad = ctx.createLinearGradient(0, h * 0.2, 0, h);
  grad.addColorStop(0, '#4A90A0');
  grad.addColorStop(1, '#2A6070');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h * 0.2, w, h * 0.8);

  for (let i = 0; i < 6; i++) {
    const rx = (i * 80 + frame * 0.3) % (w + 40) - 20;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(rx, h * 0.35 + (i % 3) * 30, 60, 4);
  }

  drawPixelRect(ctx, w * 0.1, h * 0.75, w * 0.25, 8, '#5A8A50');
  drawPixelRect(ctx, w * 0.65, h * 0.8, w * 0.2, 6, '#5A8A50');
}

export function drawKoiFish(
  ctx: CanvasRenderingContext2D,
  koi: KoiState,
  swim: KoiSwimState,
  bloated: boolean,
): void {
  const size = getStageSize(koi.growthStage);
  drawTopDownKoi(ctx, swim.x, swim.y, swim.angle, {
    skin: koi.skin,
    lengthPx: size,
    bloated,
    wigglePhase: swim.wigglePhase,
    mouthPush: swim.mouthPush,
    dead: !koi.isAlive,
    grayed: !koi.isAlive,
  });
}

export function drawStatBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  label: string,
  value: number,
  color: string,
): void {
  ctx.fillStyle = '#FFF8E7';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y);
  ctx.fillStyle = '#444';
  ctx.fillRect(x + 36, y - 8, w - 36, 8);
  ctx.fillStyle = color;
  ctx.fillRect(x + 36, y - 8, (w - 36) * (value / 100), 8);
  ctx.fillStyle = '#888';
  ctx.textAlign = 'right';
  ctx.fillText(String(Math.round(value)), x + w, y);
}

export function drawHeartBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  intensity: number,
): void {
  if (intensity <= 0) return;
  const alpha = Math.min(1, intensity);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FF6B8A';
  for (let i = 0; i < 5; i++) {
    const ox = Math.sin(frame * 0.2 + i) * 20;
    const oy = -Math.abs(Math.sin(frame * 0.15 + i * 1.2)) * 30 - i * 8;
    ctx.fillRect(x + ox - 3, y + oy - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
}
