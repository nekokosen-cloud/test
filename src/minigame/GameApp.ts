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
  private scale: number;
  private screen: ScreenId = 'fishing';
  private fishing = new FishingScreen();
  private encyclopedia = new EncyclopediaScreen();
  private tabRects: { x: number; y: number; w: number; h: number }[] = [];
  private animId = 0;
  private lastTouchY = 0;
  private raf: (cb: FrameRequestCallback) => number;

  constructor() {
    const info = wx.getSystemInfoSync();
    this.width = info.windowWidth || info.screenWidth || 375;
    this.height = info.windowHeight || info.screenHeight || 667;
    const dpr = info.pixelRatio || 1;

    this.canvas = mg.createCanvas();

    // 微信小游戏：先设尺寸再取 context，避免渲染坐标错乱
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    this.ctx = ctx;
    this.scale = dpr;
    this.resetTransform();

    this.raf =
      typeof this.canvas.requestAnimationFrame === 'function'
        ? this.canvas.requestAnimationFrame.bind(this.canvas)
        : requestAnimationFrame;

    const contentH = Math.max(200, this.height - TAB_H);
    this.fishing.layout(this.width, contentH);
    this.encyclopedia.layout(this.width, contentH);

    mg.onTouchStart(this.onTouchStart.bind(this));
    mg.onTouchMove(this.onTouchMove.bind(this));
    mg.onTouchEnd(this.onTouchEnd.bind(this));

    console.log(`[像素钓鱼] 画布 ${this.width}x${this.height} dpr=${dpr}`);

    this.loop();
  }

  private resetTransform(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.scale, this.scale);
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.globalAlpha = 1;
  }

  private loop = (): void => {
    try {
      this.update();
      this.render();
    } catch (err) {
      console.error('[像素钓鱼] 渲染错误', err);
      this.renderError(err);
    }
    this.animId = this.raf(this.loop);
  };

  private renderError(err: unknown): void {
    this.resetTransform();
    this.ctx.fillStyle = '#2A4A3A';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#E8A838';
    this.ctx.fillRect(20, 80, this.width - 40, 60);
    this.ctx.fillStyle = '#3E2731';
    this.ctx.font = '14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('渲染出错，请看控制台', this.width / 2, 115);
    console.error(err);
  }

  private update(): void {
    if (this.screen === 'fishing') {
      this.fishing.update();
    } else {
      this.encyclopedia.update();
    }
  }

  private render(): void {
    this.resetTransform();
    const contentH = Math.max(200, this.height - TAB_H);

    // 背景
    this.ctx.fillStyle = '#2A4A3A';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 先画 Tab 栏，确保底部 UI 可见
    this.tabRects = drawTabBar(this.ctx, this.width, TAB_H, contentH, this.screen);

    if (this.screen === 'fishing') {
      this.fishing.render(this.ctx, this.width, contentH);
    } else {
      this.encyclopedia.render(this.ctx, this.width, contentH);
    }
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

    const contentH = Math.max(200, this.height - TAB_H);
    if (this.screen === 'fishing') {
      this.fishing.handleTap(x, y);
    } else {
      this.encyclopedia.handleTap(x, y, this.width, contentH);
    }
  }

  destroy(): void {
    const cancel =
      typeof this.canvas.cancelAnimationFrame === 'function'
        ? this.canvas.cancelAnimationFrame.bind(this.canvas)
        : cancelAnimationFrame;
    cancel(this.animId);
    this.fishing.destroy();
  }
}
