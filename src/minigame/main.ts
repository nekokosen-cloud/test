import { GameApp } from './GameApp';

let app: GameApp | null = null;

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
  bootstrap();
}

export { GameApp, bootstrap };
