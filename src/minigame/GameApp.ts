import { FishingScreen } from '@/minigame/screens/FishingScreen';
import { EncyclopediaScreen } from '@/minigame/screens/EncyclopediaScreen';
import { KoiScreen } from '@/minigame/screens/KoiScreen';
import { drawTabBar, hitTest } from '@/minigame/ui/canvasUI';
import { createScreenLayout, type ScreenLayout } from '@/minigame/layout/screenLayout';
import type { TabId } from '@/minigame/ui/canvasUI';

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
  onShareAppMessage(callback: () => { title: string; imageUrl?: string }): void;
};

const mg = wx as MinigameWx;

export class GameApp {
  private canvas: WechatMiniprogram.Canvas;
  private ctx: CanvasRenderingContext2D;
  private layout: ScreenLayout;
  private screen: TabId = 'fishing';
  private fishing = new FishingScreen();
  private encyclopedia = new EncyclopediaScreen();
  private koi = new KoiScreen();
  private tabRects: { x: number; y: number; w: number; h: number }[] = [];
  private animId = 0;
  private lastTouchY = 0;
  private lastFrameMs = 0;
  private raf: (cb: FrameRequestCallback) => number;

  constructor() {
    const info = wx.getSystemInfoSync();
    this.layout = createScreenLayout(info);
    const dpr = info.pixelRatio || 1;

    this.canvas = mg.createCanvas();
    this.canvas.width = Math.floor(this.layout.width * dpr);
    this.canvas.height = Math.floor(this.layout.height * dpr);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    this.ctx = ctx;
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false;

    this.raf = this.createRaf();

    this.fishing.layout(this.layout);
    this.encyclopedia.layout(this.layout);
    this.koi.layout(this.layout);

    mg.onTouchStart(this.onTouchStart.bind(this));
    mg.onTouchMove(this.onTouchMove.bind(this));
    mg.onTouchEnd(this.onTouchEnd.bind(this));

    this.registerShareHandler();

    console.log(
      `[像素钓鱼] ${this.layout.width}x${this.layout.height}`,
      `safe top=${this.layout.topInset} bottom=${this.layout.bottomInset}`,
    );

    this.lastFrameMs = Date.now();
    this.render();
    this.loop();
  }

  private createRaf(): (cb: FrameRequestCallback) => number {
    if (typeof this.canvas.requestAnimationFrame === 'function') {
      return this.canvas.requestAnimationFrame.bind(this.canvas);
    }
    if (typeof requestAnimationFrame === 'function') {
      return requestAnimationFrame;
    }
    return (cb: FrameRequestCallback) =>
      setTimeout(() => cb(Date.now()), 16) as unknown as number;
  }

  private registerShareHandler(): void {
    try {
      if (typeof mg.onShareAppMessage === 'function') {
        mg.onShareAppMessage(() => {
          const fish = this.fishing.consumeSharePending();
          if (fish) {
            return {
              title: `我钓到了传说之鱼【${fish.name}】！快来像素钓鱼挑战吧~`,
            };
          }
          return { title: '像素钓鱼 - 来钓传说之鱼吧！' };
        });
      }
    } catch (err) {
      console.warn('[像素钓鱼] 分享接口不可用', err);
    }
  }

  private loop = (): void => {
    const now = Date.now();
    const dt = Math.min(50, now - this.lastFrameMs);
    this.lastFrameMs = now;

    try {
      this.update(dt);
    } catch (err) {
      console.error('[像素钓鱼] 更新错误', err);
    }
    try {
      this.render();
    } catch (err) {
      console.error('[像素钓鱼] 渲染错误', err);
      this.renderError(err);
    }
    this.animId = this.raf(this.loop);
  };

  private renderError(err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    const { width, height } = this.layout;
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = '#2A4A3A';
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.fillStyle = '#E8A838';
    this.ctx.fillRect(20, 80, width - 40, 80);
    this.ctx.fillStyle = '#3E2731';
    this.ctx.font = '13px sans-serif';
    this.ctx.textAlign = 'center';
    try {
      this.ctx.fillText('渲染出错', width / 2, 105);
      this.ctx.fillText(msg.slice(0, 28), width / 2, 130);
    } catch {
      // ignore
    }
  }

  private update(dt: number): void {
    if (this.screen === 'fishing') {
      this.fishing.update(dt);
    } else if (this.screen === 'encyclopedia') {
      this.encyclopedia.update();
    } else {
      this.koi.update(dt);
    }
  }

  private render(): void {
    const L = this.layout;
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = '#2A4A3A';
    this.ctx.fillRect(0, 0, L.width, L.height);

    if (this.screen === 'fishing') {
      this.fishing.render(this.ctx, L);
    } else if (this.screen === 'encyclopedia') {
      this.encyclopedia.render(this.ctx, L);
    } else {
      this.koi.render(this.ctx, L);
    }

    this.tabRects = drawTabBar(
      this.ctx,
      L.width,
      L.tabH,
      L.tabY,
      this.screen,
      L.bottomInset,
    );
  }

  private onTouchStart(e: MGTouchEvent): void {
    const touch = e.touches[0];
    if (!touch) return;
    this.lastTouchY = touch.clientY;

    if (this.screen === 'fishing' && this.fishing.isReelingGame()) {
      this.fishing.setReelHolding(true);
      return;
    }

    this.handleTap(touch.clientX, touch.clientY);

    // 咬钩点击收杆后，同一根手指仍按住应继续算收杆
    if (this.screen === 'fishing' && this.fishing.isReelingGame()) {
      this.fishing.setReelHolding(true);
    }
  }

  private onTouchMove(e: MGTouchEvent): void {
    if (this.screen === 'fishing' && this.fishing.isReelingGame()) {
      this.fishing.setReelHolding(true);
      return;
    }

    if (this.screen !== 'encyclopedia') return;
    const touch = e.touches[0];
    if (!touch) return;
    const dy = this.lastTouchY - touch.clientY;
    this.encyclopedia.handleScroll(dy);
    this.lastTouchY = touch.clientY;
  }

  private onTouchEnd(_e: MGTouchEvent): void {
    if (this.screen === 'fishing') {
      this.fishing.setReelHolding(false);
    }
  }

  private handleTap(x: number, y: number): void {
    const tabIds: TabId[] = ['fishing', 'encyclopedia', 'koi'];
    for (let i = 0; i < this.tabRects.length; i++) {
      if (hitTest(x, y, this.tabRects[i])) {
        const next = tabIds[i];
        if (next !== this.screen) {
          if (this.screen === 'koi') this.koi.onHide();
          this.screen = next;
          if (next === 'koi') this.koi.onShow();
        }
        return;
      }
    }

    if (this.screen === 'fishing') {
      this.fishing.handleTap(x, y);
    } else if (this.screen === 'encyclopedia') {
      this.encyclopedia.handleTap(x, y, this.layout);
    } else {
      this.koi.handleTap(x, y);
    }
  }

  destroy(): void {
    const cancel =
      typeof this.canvas.cancelAnimationFrame === 'function'
        ? this.canvas.cancelAnimationFrame.bind(this.canvas)
        : cancelAnimationFrame;
    cancel(this.animId);
    this.koi.onHide();
    this.fishing.destroy();
  }
}

export type ScreenId = TabId;
