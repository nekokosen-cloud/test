import type { ReelGameInstance } from '@/game/fsm/reelMiniGame';
import { safeFillText, setFont } from '@/minigame/ui/fonts';
import type { Rect } from '@/minigame/ui/canvasUI';

export function getReelBarRect(L: { width: number; sceneY: number; sceneH: number }): Rect {
  const barW = 36;
  const barH = Math.min(180, L.sceneH * 0.55);
  return {
    x: L.width - barW - 20,
    y: L.sceneY + (L.sceneH - barH) / 2,
    w: barW,
    h: barH,
  };
}

export function drawReelBar(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  game: ReelGameInstance,
): void {
  const { state, config } = game;
  const { x, y, w, h } = rect;

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(x - 6, y - 28, w + 12, h + 56);

  ctx.fillStyle = '#2A2A32';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#3E2731';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  const half = state.zoneSize / 2;
  const zoneTop = y + (1 - (state.zoneCenter + half)) * h;
  const zoneH = state.zoneSize * h;
  ctx.fillStyle = 'rgba(95, 160, 136, 0.55)';
  ctx.fillRect(x + 3, zoneTop, w - 6, zoneH);

  const ptrY = y + (1 - state.pointer) * h;
  ctx.fillStyle = '#E74C3C';
  ctx.fillRect(x - 2, ptrY - 3, w + 4, 6);

  const progW = w + 20;
  const progX = x - 10;
  const progY = y + h + 12;
  ctx.fillStyle = '#444';
  ctx.fillRect(progX, progY, progW, 8);
  ctx.fillStyle = '#E8A838';
  ctx.fillRect(progX, progY, progW * state.progress, 8);

  ctx.fillStyle = '#FFF8E7';
  setFont(ctx, 10, true);
  ctx.textAlign = 'center';
  safeFillText(ctx, '张力', x + w / 2, y - 12);
  safeFillText(ctx, '按住收杆', x + w / 2, progY + 20);

  const remain = Math.max(0, config.durationMs - state.elapsed);
  safeFillText(ctx, `${(remain / 1000).toFixed(1)}s`, x + w / 2, y + h + 36);
}
