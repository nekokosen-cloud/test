import { getAllFish } from '@/systems/dropTable';
import { drawFishPixelArt, getRarityBorderColor } from '@/game/renderer/fishSprites';
import { playerStore } from '@/minigame/store/playerStore';
import { drawTextCenter } from '@/minigame/ui/canvasUI';
import { safeFillText, setFont } from '@/minigame/ui/fonts';
import type { ScreenLayout } from '@/minigame/layout/screenLayout';
import type { Fish } from '@/types';

const allFish = getAllFish();
const COLS = 3;
const CELL = 92;
const SPRITE = 52;

export class EncyclopediaScreen {
  scrollY = 0;
  selectedFish: Fish | null = null;
  private gridTop = 0;
  private listBottom = 0;

  layout(L: ScreenLayout): void {
    this.gridTop = L.contentTop + 8;
    this.listBottom = L.contentBottom;
  }

  update(): void {}

  render(ctx: CanvasRenderingContext2D, L: ScreenLayout): void {
    ctx.fillStyle = '#2A4A3A';
    ctx.fillRect(0, L.contentTop, L.width, L.contentBottom - L.contentTop);

    ctx.fillStyle = '#3E2731';
    ctx.fillRect(0, L.headerY, L.width, L.headerH);
    const discovered = playerStore.getDiscoveredCount();
    drawTextCenter(ctx, '鱼种图鉴', L.width / 2, L.headerY + 18, '#E8A838', 17);
    drawTextCenter(ctx, `${discovered}/${allFish.length}`, L.width / 2, L.headerY + 36, '#FFF8E7', 12);

    const listH = this.listBottom - this.gridTop;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, this.gridTop, L.width, listH);
    ctx.clip();

    const cellStep = CELL + 8;
    allFish.forEach((fish, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = 12 + col * cellStep;
      const cy = this.gridTop + row * cellStep - this.scrollY;
      if (cy > this.listBottom || cy + CELL < this.gridTop) return;

      const discoveredFish = playerStore.isDiscovered(fish.id);
      ctx.fillStyle = discoveredFish ? '#FFF8E7' : '#2A2A32';
      ctx.fillRect(cx, cy, CELL, CELL);
      ctx.strokeStyle = discoveredFish ? getRarityBorderColor(fish.rarity) : '#555';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cy, CELL, CELL);

      const sx = cx + (CELL - SPRITE) / 2;
      const sy = cy + 6;
      ctx.save();
      ctx.translate(sx, sy);
      drawFishPixelArt(ctx, fish, SPRITE, {
        silhouette: !discoveredFish,
        showBackground: true,
      });
      ctx.restore();

      ctx.fillStyle = discoveredFish ? '#3E2731' : '#888';
      setFont(ctx, 10);
      ctx.textAlign = 'center';
      safeFillText(ctx, discoveredFish ? fish.name : '???', cx + CELL / 2, cy + CELL - 8);
    });

    ctx.restore();

    if (this.selectedFish) {
      this.renderDetail(ctx, L, this.selectedFish);
    }
  }

  private renderDetail(ctx: CanvasRenderingContext2D, L: ScreenLayout, fish: Fish): void {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, L.contentTop, L.width, L.contentBottom - L.contentTop);

    const pw = Math.min(280, L.width - 32);
    const ph = 220;
    const px = (L.width - pw) / 2;
    const py = L.contentTop + (L.contentBottom - L.contentTop - ph) / 2;

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

  handleTap(x: number, y: number, L: ScreenLayout): boolean {
    if (this.selectedFish) {
      this.selectedFish = null;
      return true;
    }

    const cellStep = CELL + 8;
    allFish.forEach((fish, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = 12 + col * cellStep;
      const cy = this.gridTop + row * cellStep - this.scrollY;
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
