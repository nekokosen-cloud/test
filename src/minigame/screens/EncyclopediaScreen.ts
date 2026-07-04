import type { Fish, FishRarity } from '@/types';
import { getAllFish, getRarityLabel, getRarityStars, RARITY_ORDER } from '@/systems/dropTable';
import { getFishCoinValue } from '@/systems/economy';
import { drawFishPixelArt, getRarityBorderColor } from '@/game/renderer/fishSprites';
import { playerStore } from '@/minigame/store/playerStore';
import { drawPixelButton, drawTextCenter, hitTest, type Rect } from '@/minigame/ui/canvasUI';
import { safeFillText, setFont } from '@/minigame/ui/fonts';
import type { ScreenLayout } from '@/minigame/layout/screenLayout';
import { loadJsonArray } from '@/minigame/utils/loadJson';
import * as environmentsModule from '@/data/environments.json';
import * as weatherModule from '@/data/weather.json';
import type { Environment, Weather } from '@/types';

const allFish = getAllFish();
const environments = loadJsonArray<Environment>(environmentsModule);
const weathers = loadJsonArray<Weather>(weatherModule);

const COLS = 3;
const CELL = 92;
const SPRITE = 52;

type FilterMode = 'all' | 'caught' | 'uncaught';

const FILTER_LABEL: Record<FilterMode, string> = {
  all: '全部',
  caught: '已收集',
  uncaught: '未收集',
};

const WEATHER_ICON: Record<string, string> = {
  sunny: '☀',
  cloudy: '☁',
  rainy: '🌧',
  foggy: '🌫',
};

const TIME_LABEL: Record<string, string> = {
  day: '白天',
  dusk: '黄昏',
  night: '夜晚',
};

export class EncyclopediaScreen {
  scrollY = 0;
  selectedFish: Fish | null = null;
  filter: FilterMode = 'all';
  private gridTop = 0;
  private listBottom = 0;
  private filterBtns: Rect[] = [];

  layout(L: ScreenLayout): void {
    this.gridTop = L.contentTop + 44;
    this.listBottom = L.contentBottom;
  }

  private getFilteredFish(): Fish[] {
    let list = [...allFish];
    if (this.filter === 'caught') list = list.filter((f) => playerStore.isDiscovered(f.id));
    if (this.filter === 'uncaught') list = list.filter((f) => !playerStore.isDiscovered(f.id));
    return list.sort((a, b) => {
      const rd = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
      return rd !== 0 ? rd : a.name.localeCompare(b.name, 'zh-CN');
    });
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

    const filterW = (L.width - 32) / 3;
    this.filterBtns = (['all', 'caught', 'uncaught'] as FilterMode[]).map((mode, i) => {
      const rect: Rect = { x: 16 + i * (filterW + 4), y: L.contentTop + 8, w: filterW, h: 28 };
      drawPixelButton(ctx, rect, FILTER_LABEL[mode], {
        primary: this.filter === mode,
        small: true,
      });
      return rect;
    });

    const filtered = this.getFilteredFish();
    const listH = this.listBottom - this.gridTop;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, this.gridTop, L.width, listH);
    ctx.clip();

    const cellStep = CELL + 8;
    filtered.forEach((fish, i) => {
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

    if (filtered.length === 0) {
      drawTextCenter(ctx, '暂无符合条件的鱼种', L.width / 2, this.gridTop + 60, '#888', 13);
    }

    if (this.selectedFish) {
      this.renderDetail(ctx, L, this.selectedFish);
    }
  }

  private formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('zh-CN');
    } catch {
      return iso;
    }
  }

  private renderDetail(ctx: CanvasRenderingContext2D, L: ScreenLayout, fish: Fish): void {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, L.contentTop, L.width, L.contentBottom - L.contentTop);

    const pw = Math.min(300, L.width - 24);
    const ph = 320;
    const px = (L.width - pw) / 2;
    const py = L.contentTop + 20;

    ctx.fillStyle = '#FFF8E7';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = getRarityBorderColor(fish.rarity);
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, pw, ph);

    const size = 72;
    ctx.save();
    ctx.translate(px + pw / 2 - size / 2, py + 12);
    drawFishPixelArt(ctx, fish, size, { showBackground: true });
    ctx.restore();

    drawTextCenter(ctx, fish.name, px + pw / 2, py + 96, '#3E2731', 18);
    drawTextCenter(ctx, getRarityLabel(fish.rarity), px + pw / 2, py + 116, '#888', 12);
    drawTextCenter(ctx, '★'.repeat(getRarityStars(fish.rarity)), px + pw / 2, py + 132, '#E8A838', 11);

    ctx.fillStyle = '#555';
    setFont(ctx, 10);
    ctx.textAlign = 'center';
    safeFillText(ctx, fish.description.slice(0, 36), px + pw / 2, py + 152);

    let ty = py + 172;
    setFont(ctx, 10, true);
    ctx.fillStyle = '#3E2731';
    ctx.textAlign = 'left';
    safeFillText(ctx, '环境:', px + 14, ty);
    ty += 14;
    setFont(ctx, 9);
    const envTags = fish.environments
      .map((e) => environments.find((env) => env.id === e)?.name ?? e)
      .join(' · ');
    safeFillText(ctx, envTags, px + 14, ty);

    ty += 18;
    setFont(ctx, 10, true);
    safeFillText(ctx, '天气:', px + 14, ty);
    ty += 14;
    setFont(ctx, 9);
    const weatherTags = fish.weather
      .map((w) => `${WEATHER_ICON[w] ?? ''}${weathers.find((wt) => wt.id === w)?.name ?? w}`)
      .join(' · ');
    safeFillText(ctx, weatherTags, px + 14, ty);

    ty += 18;
    setFont(ctx, 10, true);
    safeFillText(ctx, '时段:', px + 14, ty);
    ty += 14;
    setFont(ctx, 9);
    safeFillText(ctx, fish.timeOfDay.map((t) => TIME_LABEL[t] ?? t).join(' · '), px + 14, ty);

    ty += 20;
    setFont(ctx, 10);
    ctx.fillStyle = '#666';
    safeFillText(ctx, `钓获 x${playerStore.getCaughtCount(fish.id)}`, px + 14, ty);
    ty += 14;
    const firstAt = playerStore.getFirstCaughtAt(fish.id);
    if (firstAt) {
      safeFillText(ctx, `首次: ${this.formatDate(firstAt)}`, px + 14, ty);
      ty += 14;
    }
    safeFillText(ctx, `卖价: ${getFishCoinValue(fish, false)} 金`, px + 14, ty);

    drawTextCenter(ctx, '点击任意处关闭', px + pw / 2, py + ph - 16, '#AAA', 10);
  }

  handleTap(x: number, y: number, L: ScreenLayout): boolean {
    if (this.selectedFish) {
      this.selectedFish = null;
      return true;
    }

    for (let i = 0; i < this.filterBtns.length; i++) {
      if (hitTest(x, y, this.filterBtns[i])) {
        this.filter = (['all', 'caught', 'uncaught'] as FilterMode[])[i];
        this.scrollY = 0;
        return true;
      }
    }

    const filtered = this.getFilteredFish();
    const cellStep = CELL + 8;
    filtered.forEach((fish, i) => {
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
    const rows = Math.ceil(this.getFilteredFish().length / COLS);
    const maxScroll = Math.max(0, rows * (CELL + 8) - (this.listBottom - this.gridTop));
    this.scrollY = Math.max(0, Math.min(maxScroll, this.scrollY + deltaY));
  }
}
