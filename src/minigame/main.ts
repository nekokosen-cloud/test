import { GameApp } from './GameApp';

let app: GameApp | null = null;

type MinigameWx = WechatMiniprogram.Wx & {
  onShow(callback: () => void): void;
};

function bootstrap(): void {
  if (app) return;
  try {
    app = new GameApp();
    console.log('[像素钓鱼] 小游戏启动成功');
  } catch (err) {
    console.error('[像素钓鱼] 启动失败', err);
  }
}

if (typeof wx !== 'undefined') {
  const mg = wx as MinigameWx;
  mg.onShow(() => {
    setTimeout(bootstrap, 50);
  });
  setTimeout(bootstrap, 200);
}

export { GameApp, bootstrap };
