import { FishingScreen } from '@/minigame/screens/FishingScreen';
import { EncyclopediaScreen } from '@/minigame/screens/EncyclopediaScreen';
import { drawTabBar, hitTest } from '@/minigame/ui/canvasUI';

export type ScreenId = 'fishing' | 'encyclopedia';

interface MGTouch {
  clientX: number;
  clientY: number;
}

interface MGTouchEvent {
  touches: MGTouch[];
}

type MinigameWx = WechatMiniprogram.Wx & {
  createCanvas(): WechatMiniprogram.Canvas;
  onTouchStart(callback: (e: MGTouchEvent) => void): void;
  onTouchMove(callback: (e: MGTouchEvent) => void): void;
  onTouchEnd(callback: (e: MGTouchEvent) => void): void;
};

const mg = wx as MinigameWx;

const TAB_H = 52;

export class GameApp {
  private canvas: WechatMiniprogram.Canvas;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private dpr: number;
  private screen: ScreenId = 'fishing';
  private fishing = new FishingScreen();
  private encyclopedia = new EncyclopediaScreen();
  private tabRects: { x: number; y: number; w: number; h: number }[] = [];
  private animId = 0;
  private lastTouchY = 0;

  constructor() {
    const info = wx.getSystemInfoSync();
    this.width = info.windowWidth;
    this.height = info.windowHeight;
    this.dpr = info.pixelRatio || 2;

    this.canvas = mg.createCanvas();
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.imageSmoothingEnabled = false;

    const contentH = this.height - TAB_H;
    this.fishing.layout(this.width, contentH);
    this.encyclopedia.layout(this.width, contentH);

    mg.onTouchStart(this.onTouchStart.bind(this));
    mg.onTouchMove(this.onTouchMove.bind(this));
    mg.onTouchEnd(this.onTouchEnd.bind(this));

    wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] });
    this.loop();
  }

  private loop = (): void => {
    this.update();
    this.render();
    this.animId = requestAnimationFrame(this.loop);
  };

  private update(): void {
    if (this.screen === 'fishing') {
      this.fishing.update();
    } else {
      this.encyclopedia.update();
    }
  }

  private render(): void {
    const contentH = this.height - TAB_H;
    this.ctx.fillStyle = '#2A4A3A';
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.screen === 'fishing') {
      this.fishing.render(this.ctx, this.width);
    } else {
      this.encyclopedia.render(this.ctx, this.width, contentH);
    }

    this.tabRects = drawTabBar(this.ctx, this.width, TAB_H, contentH, this.screen);
  }

  private onTouchStart(e: MGTouchEvent): void {
    const touch = e.touches[0];
    if (!touch) return;
    this.lastTouchY = touch.clientY;
    this.handleTap(touch.clientX, touch.clientY);
  }

  private onTouchMove(e: MGTouchEvent): void {
    if (this.screen !== 'encyclopedia') return;
    const touch = e.touches[0];
    if (!touch) return;
    const dy = this.lastTouchY - touch.clientY;
    this.encyclopedia.handleScroll(dy);
    this.lastTouchY = touch.clientY;
  }

  private onTouchEnd(_e: MGTouchEvent): void {
    // noop
  }

  private handleTap(x: number, y: number): void {
    for (let i = 0; i < this.tabRects.length; i++) {
      if (hitTest(x, y, this.tabRects[i])) {
        this.screen = i === 0 ? 'fishing' : 'encyclopedia';
        return;
      }
    }

    const contentH = this.height - TAB_H;
    if (this.screen === 'fishing') {
      this.fishing.handleTap(x, y);
    } else {
      this.encyclopedia.handleTap(x, y, this.width, contentH);
    }
  }

  destroy(): void {
    cancelAnimationFrame(this.animId);
    this.fishing.destroy();
  }
}
