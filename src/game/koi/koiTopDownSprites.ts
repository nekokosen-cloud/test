import type { KoiSkin } from '@/types';

const GRID_W = 30;
const GRID_H = 14;

interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  ox: number;
  oy: number;
  ps: number;
  bloated: boolean;
}

function P(d: DrawCtx, x: number, y: number, w = 1, h = 1, color: string): void {
  if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return;
  d.ctx.fillStyle = color;
  d.ctx.fillRect(
    d.ox + x * d.ps,
    d.oy + y * d.ps,
    w * d.ps,
    h * d.ps,
  );
}

function drawMatsubaScales(d: DrawCtx, baseX: number, baseY: number, cols: number, rows: number): void {
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      P(d, baseX + col * 2, baseY + row * 2 + (col % 2), 1, 1, '#5C3D1E');
    }
  }
}

function drawGoldBody(d: DrawCtx): void {
  P(d, 8, 3, 14, 8, '#E8B830');
  P(d, 10, 2, 10, 1, '#FFD700');
  P(d, 10, 11, 10, 1, '#FFD700');
  P(d, 6, 5, 2, 4, '#FFD566');
  P(d, 22, 5, 2, 4, '#FFD566');
  drawMatsubaScales(d, 10, 4, 5, 2);
}

function drawGoldHead(d: DrawCtx, mouthPush: number): void {
  const mp = Math.max(0, Math.round(mouthPush));
  P(d, 22 + mp, 4, 6, 6, '#FFD700');
  P(d, 26 + mp, 5, 3, 4, '#FFB347');
  P(d, 28 + mp, 6, 1, 2, '#E8943A');
  P(d, 24 + mp, 5, 1, 1, '#FFFFFF');
}

function drawGoldTail(d: DrawCtx): void {
  P(d, 2, 4, 6, 6, '#E8B830');
  P(d, 0, 5, 2, 4, '#FFD566');
  P(d, 4, 3, 2, 2, '#FFD566');
  P(d, 4, 9, 2, 2, '#FFD566');
  P(d, 1, 6, 1, 2, '#C9922A');
}

function drawCommonBody(d: DrawCtx): void {
  P(d, 8, 3, 14, 8, '#F4F0E8');
  P(d, 10, 2, 10, 1, '#FFFFFF');
  P(d, 10, 11, 10, 1, '#FFFFFF');
  P(d, 6, 5, 2, 4, '#FFFFFF');
  P(d, 22, 5, 2, 4, '#FFFFFF');
  P(d, 12, 4, 6, 5, '#E74C3C');
  P(d, 10, 6, 3, 3, '#1A1A1A');
  P(d, 18, 5, 2, 2, '#1A1A1A');
  P(d, 16, 8, 2, 2, '#1A1A1A');
  P(d, 9, 3, 2, 2, '#1A1A1A');
  for (let i = 0; i < 4; i += 1) {
    P(d, 11 + i * 2, 3 + (i % 2), 1, 1, '#1A1A1A');
  }
}

function drawCommonHead(d: DrawCtx, mouthPush: number): void {
  const mp = Math.max(0, Math.round(mouthPush));
  P(d, 22 + mp, 4, 6, 6, '#FFFFFF');
  P(d, 26 + mp, 5, 3, 4, '#F4F0E8');
  P(d, 28 + mp, 6, 1, 2, '#D8D0C8');
  P(d, 23 + mp, 5, 2, 2, '#E74C3C');
  P(d, 24 + mp, 4, 2, 2, '#1A1A1A');
}

function drawCommonTail(d: DrawCtx): void {
  P(d, 2, 4, 6, 6, '#F4F0E8');
  P(d, 0, 5, 2, 4, '#FFFFFF');
  P(d, 4, 3, 2, 2, '#FFFFFF');
  P(d, 4, 9, 2, 2, '#FFFFFF');
  P(d, 2, 5, 2, 2, '#1A1A1A');
}

export interface TopDownKoiDrawOptions {
  skin: KoiSkin;
  lengthPx: number;
  bloated?: boolean;
  wigglePhase: number;
  mouthPush: number;
  dead?: boolean;
  grayed?: boolean;
}

export function drawTopDownKoi(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  angle: number,
  options: TopDownKoiDrawOptions,
): void {
  const ps = options.lengthPx / GRID_W;
  const bloated = options.bloated ?? false;
  const bodyScaleY = bloated ? 1.18 : 1;
  const wiggle = Math.sin(options.wigglePhase) * 0.22;
  const tailWiggle = Math.sin(options.wigglePhase + 1.4) * 0.38;
  const midWiggle = Math.sin(options.wigglePhase + 0.7) * 0.16;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  if (options.dead) {
    ctx.rotate(Math.PI * 0.5);
    ctx.globalAlpha = 0.7;
  }
  if (options.grayed) {
    ctx.filter = 'grayscale(0.65) brightness(0.9)';
  }

  const tailPivotX = -8 * ps;
  ctx.save();
  ctx.translate(tailPivotX, 0);
  ctx.rotate(tailWiggle);
  ctx.translate(-tailPivotX, 0);
  const tailOx = -GRID_W * ps * 0.5;
  const tailOy = -(GRID_H * ps * bodyScaleY) / 2;
  const tailDraw: DrawCtx = { ctx, ox: tailOx, oy: tailOy, ps, bloated };
  if (options.skin === 'gold') drawGoldTail(tailDraw);
  else drawCommonTail(tailDraw);
  ctx.restore();

  ctx.save();
  ctx.rotate(midWiggle);
  const bodyOx = -GRID_W * ps * 0.5;
  const bodyOy = -(GRID_H * ps * bodyScaleY) / 2;
  ctx.scale(1, bodyScaleY);
  const bodyDraw: DrawCtx = { ctx, ox: bodyOx, oy: bodyOy, ps, bloated };
  if (options.skin === 'gold') drawGoldBody(bodyDraw);
  else drawCommonBody(bodyDraw);
  ctx.restore();

  ctx.save();
  ctx.rotate(wiggle * 0.5);
  const headOx = -GRID_W * ps * 0.5;
  const headOy = -(GRID_H * ps * bodyScaleY) / 2;
  ctx.scale(1, bodyScaleY);
  const headDraw: DrawCtx = { ctx, ox: headOx, oy: headOy, ps, bloated };
  if (options.skin === 'gold') drawGoldHead(headDraw, options.mouthPush);
  else drawCommonHead(headDraw, options.mouthPush);

  const finSpread = Math.sin(options.wigglePhase * 1.2) * 0.6 + 1;
  P(headDraw, 12, Math.round(1 / finSpread), 3, 2, options.skin === 'gold' ? '#FFE566' : '#FFFFFF');
  P(headDraw, 12, Math.round(11 * finSpread), 3, 2, options.skin === 'gold' ? '#FFE566' : '#FFFFFF');
  ctx.restore();

  ctx.restore();
}

export function getTopDownKoiHitbox(lengthPx: number): { halfW: number; halfH: number } {
  const ps = lengthPx / GRID_W;
  return {
    halfW: (GRID_W * ps) / 2 + 8,
    halfH: (GRID_H * ps) / 2 + 6,
  };
}

export { GRID_W, GRID_H };
