import { getAllFish } from '@/systems/dropTable';
import { drawFishPixelArt, getRarityBorderColor } from '@/game/renderer/fishSprites';
import { playerStore } from '@/minigame/store/playerStore';
import { drawTextCenter } from '@/minigame/ui/canvasUI';
import type { Fish } from '@/types';

const allFish = getAllFish();
const COLS = 3;
const CELL = 100;
const SPRITE = 56;

export class EncyclopediaScreen {
  scrollY = 0;
  selectedFish: Fish | null = null;

  layout(_w: number, _contentH: number): void {
    // scroll only
  }

  update(): void {}

  render(ctx: CanvasRenderingContext2D, w: number, contentH: number): void {
    ctx.fillStyle = '#2A4A3A';
    ctx.fillRect(0, 0, w, contentH);

    ctx.fillStyle = '#3E2731';
    ctx.fillRect(0, 0, w, 52);
    const discovered = playerStore.getDiscoveredCount();
    drawTextCenter(ctx, '鱼种图鉴', w / 2, 18, '#E8A838', 18);
    drawTextCenter(ctx, `${discovered}/${allFish.length}`, w / 2, 38, '#FFF8E7', 13);

    const gridTop = 60;
    const rows = Math.ceil(allFish.length / COLS);
    const gridH = rows * (CELL + 8);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, gridTop, w, contentH - gridTop - 8);
    ctx.clip();

    allFish.forEach((fish, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = 12 + col * (CELL + 8);
      const cy = gridTop + row * (CELL + 8) - this.scrollY;
      if (cy > contentH || cy + CELL < gridTop) return;

      const discoveredFish = playerStore.isDiscovered(fish.id);
      ctx.fillStyle = discoveredFish ? '#FFF8E7' : '#2A2A32';
      ctx.fillRect(cx, cy, CELL, CELL);
      ctx.strokeStyle = discoveredFish ? getRarityBorderColor(fish.rarity) : '#555';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cy, CELL, CELL);

      const sx = cx + (CELL - SPRITE) / 2;
      const sy = cy + 8;
      ctx.save();
      ctx.translate(sx, sy);
      drawFishPixelArt(ctx, fish, SPRITE, {
        silhouette: !discoveredFish,
        showBackground: true,
      });
      ctx.restore();

      ctx.fillStyle = discoveredFish ? '#3E2731' : '#888';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(discoveredFish ? fish.name : '???', cx + CELL / 2, cy + CELL - 10);
    });

    ctx.restore();

    if (this.selectedFish) {
      this.renderDetail(ctx, w, contentH, this.selectedFish);
    }
  }

  private renderDetail(ctx: CanvasRenderingContext2D, w: number, h: number, fish: Fish): void {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);

    const pw = Math.min(280, w - 32);
    const ph = 220;
    const px = (w - pw) / 2;
    const py = (h - ph) / 2;

    ctx.fillStyle = '#FFF8E7';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = getRarityBorderColor(fish.rarity);
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, pw, ph);

    const size = 72;
    ctx.save();
    ctx.translate(px + pw / 2 - size / 2, py + 16);
    drawFishPixelArt(ctx, fish, size, { showBackground: true });
    ctx.restore();

    drawTextCenter(ctx, fish.name, px + pw / 2, py + 100, '#3E2731', 18);
    drawTextCenter(ctx, fish.description.slice(0, 32), px + pw / 2, py + 130, '#555', 11);
    drawTextCenter(ctx, `钓获 x${playerStore.getCaughtCount(fish.id)}`, px + pw / 2, py + 155, '#888', 12);
    drawTextCenter(ctx, '点击任意处关闭', px + pw / 2, py + 190, '#AAA', 11);
  }

  handleTap(x: number, y: number, w: number, contentH: number): boolean {
    if (this.selectedFish) {
      this.selectedFish = null;
      return true;
    }

    const gridTop = 60;
    allFish.forEach((fish, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = 12 + col * (CELL + 8);
      const cy = gridTop + row * (CELL + 8) - this.scrollY;
      if (x >= cx && x <= cx + CELL && y >= cy && y <= cy + CELL) {
        if (playerStore.isDiscovered(fish.id)) {
          this.selectedFish = fish;
        }
      }
    });

    return false;
  }

  handleScroll(deltaY: number): void {
    this.scrollY = Math.max(0, this.scrollY + deltaY);
  }
}
