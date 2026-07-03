import type { KoiParticle, KoiState } from '@/types';
import { getStageSize } from '@/game/koi/koiSimulation';
import { drawPixelRect } from '@/game/renderer/pixelRenderer';
import {
  drawTopDownKoi,
  getTopDownKoiHitbox,
} from '@/game/koi/koiTopDownSprites';

const SWIM_SPEED = 0.0045;
const WIGGLE_SPEED = 0.07;
const EAT_WIGGLE_SPEED = 0.28;

export function drawPondBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
): void {
  const margin = 14;
  const innerX = margin;
  const innerY = margin;
  const innerW = width - margin * 2;
  const innerH = height - margin * 2;

  ctx.fillStyle = '#5A4A3A';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 24; i += 1) {
    const sx = (i * 37) % innerW;
    const sy = (i * 53) % 8;
    drawPixelRect(ctx, innerX + sx, innerY + sy, 6, 4, i % 2 === 0 ? '#6B5A48' : '#4A3A2A');
    drawPixelRect(ctx, innerX + sx, innerY + innerH - sy - 4, 6, 4, i % 2 === 0 ? '#4A3A2A' : '#6B5A48');
  }

  ctx.fillStyle = '#2A6B8A';
  ctx.fillRect(innerX, innerY, innerW, innerH);

  ctx.fillStyle = '#3580A0';
  ctx.fillRect(innerX + 8, innerY + 8, innerW - 16, innerH - 16);

  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 6; i += 1) {
    const cx = innerX + 40 + (i * 55) % (innerW - 80);
    const cy = innerY + 30 + (i * 70) % (innerH - 60);
    ctx.beginPath();
    ctx.ellipse(
      cx + Math.sin(frame * 0.02 + i) * 4,
      cy + Math.cos(frame * 0.015 + i) * 3,
      18 + i * 2,
      10 + i,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let row = 0; row < 5; row += 1) {
    ctx.beginPath();
    for (let x = innerX; x <= innerX + innerW; x += 6) {
      const y = innerY + 20 + row * (innerH / 6) + Math.sin((x + frame * 0.8 + row * 50) * 0.03) * 2;
      if (x === innerX) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  drawLilyPad(ctx, innerX + 24, innerY + 24, frame, 0);
  drawLilyPad(ctx, innerX + innerW - 44, innerY + 36, frame, 1.5);
  drawLilyPad(ctx, innerX + 36, innerY + innerH - 48, frame, 3);
  drawLilyPad(ctx, innerX + innerW - 56, innerY + innerH - 40, frame, 4.5);
  drawRock(ctx, innerX + innerW * 0.55, innerY + innerH * 0.2);
  drawRock(ctx, innerX + innerW * 0.15, innerY + innerH * 0.65);
}

function drawLilyPad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  phase: number,
): void {
  const bob = Math.sin(frame * 0.03 + phase) * 1;
  ctx.fillStyle = '#3A8A5A';
  ctx.beginPath();
  ctx.ellipse(x, y + bob, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4AA86A';
  ctx.beginPath();
  ctx.ellipse(x - 3, y - 2 + bob, 8, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2A6A4A';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + bob);
  ctx.lineTo(x + 10, y - 8 + bob);
  ctx.stroke();
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  drawPixelRect(ctx, x, y, 18, 10, '#7A7A72');
  drawPixelRect(ctx, x + 3, y - 3, 12, 5, '#8A8A82');
  drawPixelRect(ctx, x + 6, y + 2, 6, 4, '#6A6A62');
}

export interface KoiDrawParams {
  koi: KoiState;
  width: number;
  height: number;
  frame: number;
  petBurst: number;
  feedBurst: number;
}

export function getKoiPosition(params: KoiDrawParams): {
  x: number;
  y: number;
  angle: number;
} {
  const { width, height, frame, koi, petBurst } = params;
  const speed = koi.happiness >= 70 ? SWIM_SPEED * 1.08 : SWIM_SPEED;
  const t = frame * speed;
  const margin = 50;
  const cx = width * 0.5;
  const cy = height * 0.5;
  const rx = width * 0.5 - margin;
  const ry = height * 0.5 - margin;
  const wander = Math.sin(t * 0.35) * 18;
  const jump = petBurst > 0 ? Math.sin(petBurst * 0.12) * 6 : 0;
  const x = cx + Math.sin(t) * rx + wander;
  const y = cy + Math.sin(t * 0.62 + 1.2) * ry + jump;
  const nextT = t + 0.02;
  const nextX = cx + Math.sin(nextT) * rx + Math.sin(nextT * 0.35) * 18;
  const nextY = cy + Math.sin(nextT * 0.62 + 1.2) * ry;
  const angle = Math.atan2(nextY - y, nextX - x);
  return { x, y, angle };
}

export function drawKoi(
  ctx: CanvasRenderingContext2D,
  params: KoiDrawParams,
): { x: number; y: number; length: number } {
  const { koi, frame, feedBurst } = params;
  const pos = getKoiPosition(params);
  let length = getStageSize(koi.growthStage);
  if (koi.fullness >= 80) length = Math.floor(length * 1.1);

  const isEating = feedBurst > 0;
  const wigglePhase = frame * (isEating ? EAT_WIGGLE_SPEED : WIGGLE_SPEED);
  const mouthPush = isEating
    ? (Math.sin(frame * 0.45) * 0.5 + 0.5) * 2.5
    : Math.sin(frame * WIGGLE_SPEED) * 0.15;

  drawTopDownKoi(ctx, pos.x, pos.y, pos.angle, {
    skin: koi.skin,
    lengthPx: length,
    bloated: koi.fullness >= 80,
    wigglePhase,
    mouthPush,
    dead: !koi.isAlive,
    grayed: koi.health <= 30 && koi.isAlive,
  });

  if (koi.growthStage >= 4 && koi.isAlive) {
    ctx.globalAlpha = 0.15 + Math.sin(frame * 0.06) * 0.08;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, length * 0.55, length * 0.22, pos.angle, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  return { x: pos.x, y: pos.y, length };
}

export function spawnFoodParticles(x: number, y: number, angle: number): KoiParticle[] {
  const headX = x + Math.cos(angle) * 20;
  const headY = y + Math.sin(angle) * 20;
  return Array.from({ length: 10 }, () => ({
    x: headX + (Math.random() - 0.5) * 24,
    y: headY + (Math.random() - 0.5) * 24,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    life: 50 + Math.random() * 30,
    maxLife: 80,
    color: Math.random() > 0.5 ? '#E8A838' : '#D4882A',
    size: 3 + Math.round(Math.random()),
    type: 'food' as const,
  }));
}

export function spawnHeartParticles(x: number, y: number): KoiParticle[] {
  return Array.from({ length: 5 }, () => ({
    x: x + (Math.random() - 0.5) * 20,
    y: y + (Math.random() - 0.5) * 12,
    vx: (Math.random() - 0.5) * 0.8,
    vy: -0.8 - Math.random() * 0.6,
    life: 35 + Math.random() * 25,
    maxLife: 60,
    color: '#FF6B8A',
    size: 4,
    type: 'heart' as const,
  }));
}

export function spawnBubbleParticle(x: number, y: number): KoiParticle {
  return {
    x: x + (Math.random() - 0.5) * 10,
    y: y + (Math.random() - 0.5) * 8,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -0.5 - Math.random() * 0.3,
    life: 55,
    maxLife: 55,
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
      life: p.life - 1,
    }))
    .filter((p) => p.life > 0);
}

export function drawKoiParticles(ctx: CanvasRenderingContext2D, particles: KoiParticle[]): void {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    if (p.type === 'heart') {
      drawPixelRect(ctx, p.x, p.y, p.size, p.size, p.color);
      drawPixelRect(ctx, p.x - p.size, p.y, p.size, p.size, p.color);
      drawPixelRect(ctx, p.x + p.size, p.y, p.size, p.size, p.color);
    } else if (p.type === 'bubble') {
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
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
  const length = getStageSize(params.koi.growthStage);
  const { halfW, halfH } = getTopDownKoiHitbox(length);
  const dx = tapX - pos.x;
  const dy = tapY - pos.y;
  const cos = Math.cos(-pos.angle);
  const sin = Math.sin(-pos.angle);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  return Math.abs(localX) <= halfW && Math.abs(localY) <= halfH;
}
