import type { Environment, Fish, FishingState, Particle, Weather, WeatherId } from '@/types';
import { FishingFSM } from '@/game/fsm/fishingFSM';
import { playerStore } from '@/minigame/store/playerStore';
import { vibrateBite, vibrateReel } from '@/minigame/adapters/vibration';
import { drawFishPixelArt, getRarityBorderColor } from '@/game/renderer/fishSprites';
import { getRarityLabel } from '@/systems/dropTable';
import { safeFillText, setFont } from '@/minigame/ui/fonts';
import {
  drawSky,
  drawWaterSurface,
  drawEnvironmentDecor,
  drawBobber,
  drawRod,
  drawFishShadow,
  drawParticles,
  drawScreenFlash,
  drawFishSprite,
  spawnSplashParticles,
  updateParticles,
} from '@/game/renderer/pixelRenderer';
import { drawPanel, drawPixelButton, drawTextCenter, hitTest, type Rect } from '@/minigame/ui/canvasUI';
import environmentsData from '@/data/environments.json';
import weatherData from '@/data/weather.json';
import type { EnvironmentId } from '@/types';

const environments = environmentsData as Environment[];
const weathers = weatherData as Weather[];

const STATUS: Record<FishingState, string> = {
  idle: '点击「抛竿」开始钓鱼',
  casting: '抛竿中...',
  waiting: '等待鱼儿上钩...',
  biting: '咬钩了！快点屏幕收杆！',
  reeling: '收杆中...',
  caught: '恭喜钓到了！',
  escaped: '鱼跑了！再试一次吧',
};

const WEATHER_LABEL: Record<WeatherId, string> = {
  sunny: '晴',
  cloudy: '云',
  rainy: '雨',
  foggy: '雾',
};

export class FishingScreen {
  private fsm: FishingFSM;
  private fishingState: FishingState = 'idle';
  private caughtFish: Fish | null = null;
  private isNewDiscovery = false;
  private screenFlash = 0;
  private statusText = STATUS.idle;
  private frame = 0;
  private particles: Particle[] = [];
  private prevState: FishingState = 'idle';

  castBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  envBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  weatherBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  dismissBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  canvasArea: Rect = { x: 0, y: 0, w: 0, h: 0 };

  constructor() {
    this.fsm = this.createFSM();
  }

  private createFSM(): FishingFSM {
    return new FishingFSM(
      {
        environmentId: playerStore.environmentId,
        weatherId: playerStore.weatherId,
        timeOfDay: 'day',
      },
      {
        onStateChange: (state) => {
          this.fishingState = state;
          this.statusText = STATUS[state];
        },
        onBite: () => {
          if (playerStore.save.settings.vibration) vibrateBite();
          this.screenFlash = 0.4;
          setTimeout(() => { this.screenFlash = 0; }, 150);
        },
        onFishCaught: (fish) => {
          this.isNewDiscovery = playerStore.recordCatch(fish);
          this.caughtFish = fish;
          if (playerStore.save.settings.vibration) vibrateReel();
        },
        onFishEscaped: () => {
          this.statusText = STATUS.escaped;
        },
      },
    );
  }

  layout(w: number, contentH: number): void {
    const controlsBlock = 110;
    const sceneH = Math.max(200, Math.min(360, contentH - 52 - controlsBlock - 12));
    this.canvasArea = { x: 0, y: 52, w: Math.max(1, w), h: sceneH };
    const controlsY = 52 + sceneH + 10;
    this.castBtn = { x: w / 2 - 60, y: controlsY, w: 120, h: 40 };
    this.envBtn = { x: 16, y: controlsY + 46, w: (w - 40) / 2, h: 40 };
    this.weatherBtn = { x: 24 + (w - 40) / 2, y: controlsY + 46, w: (w - 40) / 2, h: 40 };
    this.dismissBtn = { x: w / 2 - 70, y: contentH / 2 + 60, w: 140, h: 40 };
  }

  update(): void {
    this.fsm.updateContext({
      environmentId: playerStore.environmentId,
      weatherId: playerStore.weatherId,
      timeOfDay: 'day',
    });
    this.frame += 1;

    if (this.fishingState === 'biting' && this.prevState !== 'biting') {
      const waterY = this.canvasArea.y + this.canvasArea.h * 0.45;
      this.particles = [
        ...this.particles,
        ...spawnSplashParticles(this.canvasArea.w / 2, waterY, 15),
      ];
    }
    this.prevState = this.fishingState;
    this.particles = updateParticles(this.particles);
  }

  render(ctx: CanvasRenderingContext2D, w: number, contentH: number): void {
    const env = environments.find((e) => e.id === playerStore.environmentId)
      ?? environments[0];
    const weather = weathers.find((wt) => wt.id === playerStore.weatherId)
      ?? weathers[0];

    // 顶部标题栏
    ctx.fillStyle = '#3E2731';
    ctx.fillRect(0, 0, w, 52);
    ctx.fillStyle = '#E8A838';
    setFont(ctx, 16, true);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    safeFillText(ctx, env.name, 16, 22);
    ctx.fillStyle = '#FFF8E7';
    setFont(ctx, 13);
    safeFillText(ctx, `${WEATHER_LABEL[playerStore.weatherId]} ${weather.name}`, 16, 40);

    // 场景（单独 try，失败不影响按钮）
    try {
      ctx.save();
      ctx.translate(this.canvasArea.x, this.canvasArea.y);
      ctx.beginPath();
      ctx.rect(0, 0, Math.max(1, this.canvasArea.w), Math.max(1, this.canvasArea.h));
      ctx.clip();

      const waterY = this.canvasArea.h * 0.45;
      const bobberX = this.canvasArea.w / 2;

      drawSky(ctx, this.canvasArea.w, waterY, env.skyColor, weather, this.frame);
      drawEnvironmentDecor(ctx, env.id, this.canvasArea.w, waterY);
      drawWaterSurface(ctx, this.canvasArea.w, waterY, env.waterColor, this.frame);

      if (this.fishingState === 'waiting' || this.fishingState === 'biting') {
        drawFishShadow(ctx, bobberX, waterY + 20, this.fishingState === 'biting' ? 0.7 : 0.25, this.frame);
      }

      drawRod(ctx, this.frame);

      if (['waiting', 'biting', 'reeling'].includes(this.fishingState)) {
        drawBobber(ctx, bobberX, waterY - 10, this.fishingState === 'biting', this.frame);
      }

      if (this.fishingState === 'caught' && this.caughtFish) {
        const bounce = Math.abs(Math.sin(this.frame * 0.15)) * 10;
        drawFishSprite(ctx, bobberX - 20, waterY - 60 - bounce, this.caughtFish, 1.5);
      }

      drawParticles(ctx, this.particles);
      drawScreenFlash(ctx, this.canvasArea.w, this.canvasArea.h, this.screenFlash);
      ctx.restore();
    } catch (err) {
      console.error('[像素钓鱼] 场景渲染失败', err);
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 52, w, this.canvasArea.h);
    }

    // 控件区背景
    const panelY = this.canvasArea.y + this.canvasArea.h;
    const panelH = Math.max(0, contentH - panelY);
    if (panelH > 0) {
      ctx.fillStyle = '#2A4A3A';
      ctx.fillRect(0, panelY, w, panelH);
    }

    const statusColor = this.fishingState === 'biting' ? '#FF6B6B' : '#FFF8E7';
    drawTextCenter(ctx, this.statusText, w / 2, this.canvasArea.y + this.canvasArea.h + 20, statusColor, this.fishingState === 'biting' ? 16 : 14);

    const canCast = this.fishingState === 'idle';
    const castLabel = this.fishingState === 'casting' ? '抛竿中...' : this.fishingState === 'waiting' ? '等待中...' : '抛竿';
    drawPixelButton(ctx, this.castBtn, castLabel, { disabled: !canCast });

    drawPixelButton(ctx, this.envBtn, '环境', { primary: false, small: true });
    drawPixelButton(ctx, this.weatherBtn, '天气', { primary: false, small: true });

    if (this.fishingState === 'caught' && this.caughtFish) {
      this.renderCatchModal(ctx, w);
    }
  }

  private renderCatchModal(ctx: CanvasRenderingContext2D, w: number): void {
    const fish = this.caughtFish!;
    const panelW = Math.min(300, w - 40);
    const panelH = 280;
    const px = (w - panelW) / 2;
    const py = 120;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, 800);

    drawPanel(ctx, px, py, panelW, panelH, this.isNewDiscovery ? '新发现!' : '钓到了!');

    const spriteSize = 80;
    const sx = px + panelW / 2 - spriteSize / 2;
    const sy = py + 50;
    ctx.strokeStyle = getRarityBorderColor(fish.rarity);
    ctx.lineWidth = 3;
    ctx.strokeRect(sx - 4, sy - 4, spriteSize + 8, spriteSize + 8);
    ctx.save();
    ctx.translate(sx, sy);
    drawFishPixelArt(ctx, fish, spriteSize, { showBackground: true });
    ctx.restore();

    drawTextCenter(ctx, fish.name, px + panelW / 2, sy + spriteSize + 24, '#3E2731', 18);
    drawTextCenter(ctx, getRarityLabel(fish.rarity), px + panelW / 2, sy + spriteSize + 44, '#888', 12);

    ctx.fillStyle = '#555';
    setFont(ctx, 12);
    ctx.textAlign = 'center';
    const desc = fish.description.length > 28 ? `${fish.description.slice(0, 28)}...` : fish.description;
    safeFillText(ctx, desc, px + panelW / 2, sy + spriteSize + 64);

    drawPixelButton(ctx, this.dismissBtn, '继续钓鱼');
  }

  handleTap(x: number, y: number): boolean {
    if (this.fishingState === 'caught' && this.caughtFish) {
      if (hitTest(x, y, this.dismissBtn)) {
        this.fsm.dismissCatch();
        this.caughtFish = null;
        return true;
      }
      this.fsm.dismissCatch();
      this.caughtFish = null;
      return true;
    }

    if (hitTest(x, y, this.castBtn) && this.fishingState === 'idle') {
      this.fsm.cast();
      return true;
    }

    if (hitTest(x, y, this.envBtn)) {
      this.cycleEnvironment();
      return true;
    }

    if (hitTest(x, y, this.weatherBtn)) {
      this.cycleWeather();
      return true;
    }

    if (hitTest(x, y, this.canvasArea)) {
      if (this.fishingState === 'biting') {
        if (playerStore.save.settings.vibration) vibrateReel();
        this.fsm.reel();
      } else if (this.fishingState === 'escaped') {
        this.fsm.dismissCatch();
      }
      return true;
    }

    return false;
  }

  private cycleEnvironment(): void {
    const ids: EnvironmentId[] = ['lake', 'river', 'ocean', 'pond'];
    const idx = ids.indexOf(playerStore.environmentId);
    playerStore.setEnvironment(ids[(idx + 1) % ids.length]);
    this.fsm.updateContext({
      environmentId: playerStore.environmentId,
      weatherId: playerStore.weatherId,
      timeOfDay: 'day',
    });
  }

  private cycleWeather(): void {
    const ids: WeatherId[] = ['sunny', 'cloudy', 'rainy', 'foggy'];
    const idx = ids.indexOf(playerStore.weatherId);
    playerStore.setWeather(ids[(idx + 1) % ids.length]);
    this.fsm.updateContext({
      environmentId: playerStore.environmentId,
      weatherId: playerStore.weatherId,
      timeOfDay: 'day',
    });
  }

  destroy(): void {
    this.fsm.destroy();
  }
}
