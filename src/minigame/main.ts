import { GameApp } from './GameApp';

interface MinigameWx extends WechatMiniprogram.Wx {
  createCanvas(): WechatMiniprogram.Canvas;
  onShow(callback: () => void): void;
}

let app: GameApp | null = null;
let booting = false;

function showBootError(err: unknown): void {
  try {
    const mg = wx as MinigameWx;
    const canvas = mg.createCanvas();
    const info = wx.getSystemInfoSync();
    const w = info.windowWidth || 375;
    const h = info.windowHeight || 667;
    const dpr = info.pixelRatio || 1;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#2A4A3A';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#E8A838';
    ctx.fillRect(20, 80, w - 40, 100);
    ctx.fillStyle = '#3E2731';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    const msg = err instanceof Error ? err.message : String(err);
    ctx.fillText('游戏启动失败', w / 2, 110);
    ctx.fillText(msg.slice(0, 24), w / 2, 135);
    ctx.fillText('请重新编译 game-dist', w / 2, 160);
  } catch {
    // ignore
  }
}

function bootstrap(): void {
  if (app || booting) return;
  booting = true;
  try {
    app = new GameApp();
    console.log('[像素钓鱼] 小游戏启动成功');
  } catch (err) {
    console.error('[像素钓鱼] 启动失败', err);
    showBootError(err);
  } finally {
    booting = false;
  }
}

if (typeof wx !== 'undefined') {
  const mg = wx as MinigameWx;
  // 真机预览建议在 onShow 后初始化 Canvas
  if (typeof mg.onShow === 'function') {
    mg.onShow(() => bootstrap());
  }
  bootstrap();
}

export { GameApp, bootstrap };
