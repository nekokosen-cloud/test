import type { Environment, Fish, Particle, Weather, WeatherId } from '@/types';
import { drawFishPixelArt } from '@/game/renderer/fishSprites';

const PIXEL = 4;

export function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

export function drawFishSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fish: Fish,
  scale = 1,
): void {
  const size = Math.floor(PIXEL * 4 * scale);
  ctx.save();
  ctx.translate(x, y);
  drawFishPixelArt(ctx, fish, size, { silhouette: false, showBackground: false });
  ctx.restore();
}

export function drawBobber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  biting: boolean,
  frame: number,
): void {
  const s = PIXEL;
  const bob = biting ? Math.sin(frame * 0.8) * 6 : Math.sin(frame * 0.15) * 2;
  const by = y + bob;
  const sink = biting ? 12 : 0;

  // line
  ctx.strokeStyle = '#3E2731';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, 60);
  ctx.lineTo(x, by - s * 2 + sink);
  ctx.stroke();

  // bobber body
  drawPixelRect(ctx, x - s, by + sink, s * 2, s * 3, '#E74C3C');
  drawPixelRect(ctx, x - s, by + s * 3 + sink, s * 2, s * 2, '#FFFFFF');
  // highlight
  drawPixelRect(ctx, x - s * 0.5, by + sink + s * 0.5, s * 0.5, s, '#FF8888');
}

export function drawWaterSurface(
  ctx: CanvasRenderingContext2D,
  width: number,
  waterY: number,
  waterColor: string,
  frame: number,
): void {
  ctx.fillStyle = waterColor;
  ctx.fillRect(0, waterY, width, 400);

  // wave lines
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    for (let x = 0; x <= width; x += 4) {
      const y = waterY + 8 + i * 12 + Math.sin((x + frame * 2 + i * 30) * 0.05) * 3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

export function drawSky(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  skyColor: string,
  weather: Weather,
  frame: number,
): void {
  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, width, height);

  // clouds
  if (weather.id === 'cloudy' || weather.id === 'rainy' || weather.id === 'foggy') {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    const cloudOffset = frame * 0.3;
    drawCloud(ctx, 50 + cloudOffset % 300, 40, 40);
    drawCloud(ctx, 200 + (cloudOffset * 0.7) % 250, 60, 30);
    drawCloud(ctx, 100 + (cloudOffset * 0.5) % 350, 25, 25);
  }

  // sun
  if (weather.id === 'sunny') {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(280, 30, 24, 24);
    ctx.fillStyle = 'rgba(255,220,100,0.2)';
    ctx.fillRect(272, 22, 40, 40);
  }

  // weather overlay
  if (weather.skyOverlay) {
    ctx.fillStyle = weather.skyOverlay;
    ctx.fillRect(0, 0, width, height);
  }

  // rain
  if (weather.id === 'rainy') {
    ctx.strokeStyle = 'rgba(180,200,255,0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const rx = (i * 37 + frame * 3) % width;
      const ry = (i * 23 + frame * 5) % height;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 3, ry + 8);
      ctx.stroke();
    }
  }

  // fog
  if (weather.id === 'foggy') {
    ctx.fillStyle = 'rgba(220,230,240,0.3)';
    for (let i = 0; i < 5; i++) {
      const fx = (i * 80 + frame * 0.2) % (width + 60) - 30;
      ctx.fillRect(fx, 80 + i * 15, 100, 20);
    }
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const s = PIXEL;
  ctx.fillRect(x, y, size, s * 2);
  ctx.fillRect(x - s * 2, y + s, s * 2, s * 2);
  ctx.fillRect(x + size, y + s, s * 3, s * 2);
}

export function drawEnvironmentDecor(
  ctx: CanvasRenderingContext2D,
  envId: string,
  width: number,
  waterY: number,
): void {
  if (envId === 'lake') {
    // reeds
    for (let i = 0; i < 5; i++) {
      const rx = 20 + i * 18;
      drawPixelRect(ctx, rx, waterY - 20, 3, 20, '#5A8A4A');
      drawPixelRect(ctx, rx + 4, waterY - 15, 3, 15, '#6B9A5A');
    }
  } else if (envId === 'river') {
    // rocks
    drawPixelRect(ctx, 30, waterY - 8, 20, 8, '#8B7355');
    drawPixelRect(ctx, 200, waterY - 6, 16, 6, '#9B8365');
    drawPixelRect(ctx, 300, waterY - 10, 24, 10, '#7B6345');
  } else if (envId === 'ocean') {
    // pier
    drawPixelRect(ctx, 0, waterY - 30, 60, 6, '#8B6040');
    for (let i = 0; i < 4; i++) {
      drawPixelRect(ctx, 10 + i * 14, waterY - 30, 4, 30, '#6B4020');
    }
  } else if (envId === 'pond') {
    // lily pads
    drawPixelRect(ctx, 80, waterY + 5, 16, 10, '#4A8A5A');
    drawPixelRect(ctx, 200, waterY + 10, 14, 8, '#5A9A6A');
    drawPixelRect(ctx, 280, waterY + 3, 12, 8, '#4A8A5A');
    // fence
    drawPixelRect(ctx, 0, waterY - 20, width, 3, '#8B6040');
    for (let i = 0; i < 8; i++) {
      drawPixelRect(ctx, i * 50, waterY - 35, 3, 15, '#8B6040');
    }
  }
}

export function spawnSplashParticles(x: number, y: number, count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 4 - 1,
      life: 20 + Math.random() * 15,
      maxLife: 35,
      color: Math.random() > 0.5 ? '#FFFFFF' : '#A0D0E0',
      size: 2 + Math.random() * 3,
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.15,
      life: p.life - 1,
    }))
    .filter((p) => p.life > 0);
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    drawPixelRect(ctx, p.x, p.y, p.size, p.size, p.color);
  }
  ctx.globalAlpha = 1;
}

export function drawFishShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  alpha: number,
  frame: number,
): void {
  ctx.globalAlpha = alpha;
  const wobble = Math.sin(frame * 0.5) * 8;
  drawPixelRect(ctx, x - 16 + wobble, y, 32, 8, '#2A4A5A');
  drawPixelRect(ctx, x - 8 + wobble, y - 4, 16, 4, '#3A5A6A');
  ctx.globalAlpha = 1;
}

export function drawScreenFlash(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number): void {
  if (intensity <= 0) return;
  ctx.fillStyle = `rgba(255,255,255,${intensity})`;
  ctx.fillRect(0, 0, width, height);
}

export function drawRod(ctx: CanvasRenderingContext2D, frame: number): void {
  const s = PIXEL;
  // fisherman silhouette (simple pixel character)
  drawPixelRect(ctx, 30, 180, s * 2, s * 6, '#3E2731');
  drawPixelRect(ctx, 26, 170, s * 3, s * 2, '#E8A838');
  drawPixelRect(ctx, 28, 165, s * 2, s, '#FFDAB0');
  // rod
  ctx.strokeStyle = '#8B6040';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(38, 200);
  const rodEnd = 180 + Math.sin(frame * 0.1) * 3;
  ctx.quadraticCurveTo(120, rodEnd - 40, 187, rodEnd);
  ctx.stroke();
}

export { PIXEL };
