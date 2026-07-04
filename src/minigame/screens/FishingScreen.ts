import type { Environment, Fish, FishingState, Particle, TimeOfDay, Weather, WeatherId } from '@/types';
import { FishingFSM } from '@/game/fsm/fishingFSM';
import { playerStore, gearData } from '@/minigame/store/playerStore';
import { vibrateBite, vibrateReel } from '@/minigame/adapters/vibration';
import { playSound, syncSoundFromSettings } from '@/minigame/adapters/audio';
import { drawFishPixelArt, getRarityBorderColor } from '@/game/renderer/fishSprites';
import { getRarityLabel } from '@/systems/dropTable';
import { formatCoins } from '@/systems/economy';
import { safeFillText, setFont } from '@/minigame/ui/fonts';
import {
  drawFishingScene,
  spawnCastSplash,
  spawnCatchParticles,
  spawnSplashParticles,
  updateParticles,
} from '@/minigame/renderer/fishingSceneDraw';
import { drawReelBar, getReelBarRect } from '@/minigame/renderer/reelBarDraw';
import { drawPanel, drawPixelButton, drawTextCenter, hitTest, type Rect } from '@/minigame/ui/canvasUI';
import { loadJsonArray } from '@/minigame/utils/loadJson';
import {
  createSceneMetrics,
  type SceneMetrics,
  type ScreenLayout,
} from '@/minigame/layout/screenLayout';
import * as environmentsModule from '@/data/environments.json';
import * as weatherModule from '@/data/weather.json';
import type { EnvironmentId } from '@/types';

const environments = loadJsonArray<Environment>(environmentsModule);
const weathers = loadJsonArray<Weather>(weatherModule);

const STATUS: Record<FishingState, string> = {
  idle: '点击「抛竿」开始钓鱼',
  casting: '抛竿中...',
  waiting: '等待鱼儿上钩...',
  biting: '咬钩了！点击收杆！',
  reeling: '收杆中...',
  reeling_game: '按住屏幕，保持张力！',
  caught: '恭喜钓到了！',
  escaped: '鱼跑了！再试一次吧',
};

const WEATHER_LABEL: Record<WeatherId, string> = {
  sunny: '晴',
  cloudy: '云',
  rainy: '雨',
  foggy: '雾',
};

const TIME_LABEL: Record<TimeOfDay, string> = {
  day: '白天',
  dusk: '黄昏',
  night: '夜晚',
};

export class FishingScreen {
  private fsm: FishingFSM;
  private fishingState: FishingState = 'idle';
  private caughtFish: Fish | null = null;
  private isNewDiscovery = false;
  private coinsEarned = 0;
  private screenFlash = 0;
  private statusText = STATUS.idle;
  private frame = 0;
  private particles: Particle[] = [];
  private prevState: FishingState = 'idle';
  private screenLayout: ScreenLayout | null = null;
  private sceneMetrics: SceneMetrics | null = null;
  private escapeAnim = 0;
  private showGearPanel = false;
  private sharePending: Fish | null = null;
  private reelHolding = false;
  private castCount = 0;

  castBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  envBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  weatherBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  timeBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  gearBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  dismissBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  canvasArea: Rect = { x: 0, y: 0, w: 0, h: 0 };
  statusY = 0;
  reelBarRect: Rect = { x: 0, y: 0, w: 0, h: 0 };

  constructor() {
    syncSoundFromSettings(playerStore.save.settings.sound);
    this.fsm = this.createFSM();
  }

  private gameContext() {
    return {
      environmentId: playerStore.environmentId,
      weatherId: playerStore.weatherId,
      timeOfDay: playerStore.timeOfDay,
      baitId: playerStore.baitId,
      rodZoneBonus: playerStore.getRodZoneBonus(),
    };
  }

  private createFSM(): FishingFSM {
    return new FishingFSM(this.gameContext(), {
      onStateChange: (state) => {
        this.fishingState = state;
        this.statusText = STATUS[state];
        if (state === 'escaped') {
          playerStore.resetStreakOnEscape();
          this.escapeAnim = 1;
          playSound('reel_fail');
        }
        if (state === 'waiting' && this.prevState === 'casting') {
          playSound('splash');
        }
      },
      onBite: () => {
        if (playerStore.save.settings.vibration) vibrateBite();
        playSound('bite');
        this.screenFlash = 0.55;
        setTimeout(() => { this.screenFlash = 0; }, 200);
        if (this.sceneMetrics) {
          this.particles = [
            ...this.particles,
            ...spawnSplashParticles(this.sceneMetrics.bobberX, this.sceneMetrics.bobberY + 8, 22),
          ];
        }
      },
      onFishCaught: (fish) => {
        const result = playerStore.recordCatch(fish);
        this.isNewDiscovery = result.isNew;
        this.coinsEarned = result.coinsEarned;
        this.caughtFish = fish;
        if (playerStore.save.settings.vibration) vibrateReel();
        playSound('catch');
        this.screenFlash = fish.rarity === 'legendary' ? 0.85 : fish.rarity === 'epic' ? 0.65 : 0.45;
        setTimeout(() => { this.screenFlash = 0; }, 350);
        if (this.sceneMetrics) {
          this.particles = [
            ...this.particles,
            ...spawnCatchParticles(this.sceneMetrics.bobberX, this.sceneMetrics.bobberY, fish.rarity),
          ];
        }
        if (fish.rarity === 'legendary') {
          this.sharePending = fish;
        }
        this.castCount += 1;
        if (this.castCount % 5 === 0) {
          playerStore.cycleTimeOfDay();
        }
      },
      onFishEscaped: () => {
        this.statusText = STATUS.escaped;
      },
    });
  }

  layout(L: ScreenLayout): void {
    this.screenLayout = L;
    this.canvasArea = { x: 0, y: L.sceneY, w: L.width, h: L.sceneH };
    this.sceneMetrics = createSceneMetrics(L.width, L.sceneH);
    this.reelBarRect = getReelBarRect(L);

    const cy = L.controlsY;
    const quarter = (L.width - 32) / 4;
    this.statusY = cy + 8;
    this.castBtn = { x: L.width / 2 - 64, y: cy + 24, w: 128, h: 40 };
    this.envBtn = { x: 16, y: cy + 72, w: quarter, h: 34 };
    this.weatherBtn = { x: 16 + quarter + 4, y: cy + 72, w: quarter, h: 34 };
    this.timeBtn = { x: 16 + (quarter + 4) * 2, y: cy + 72, w: quarter, h: 34 };
    this.gearBtn = { x: 16 + (quarter + 4) * 3, y: cy + 72, w: quarter, h: 34 };
    this.dismissBtn = { x: L.width / 2 - 70, y: L.contentTop + L.contentH / 2, w: 140, h: 40 };
  }

  update(dtMs = 16): void {
    this.fsm.updateContext(this.gameContext());
    this.frame += 1;

    if (this.fishingState === 'reeling_game') {
      this.fsm.updateReelGame(dtMs, this.reelHolding);
    }

    if (this.fishingState === 'casting' && this.prevState !== 'casting' && this.sceneMetrics) {
      this.particles = [
        ...this.particles,
        ...spawnCastSplash(this.sceneMetrics.bobberX, this.sceneMetrics.bobberY),
      ];
      playSound('cast');
    }

    if (this.fishingState === 'biting' && this.prevState !== 'biting' && this.sceneMetrics) {
      this.particles = [
        ...this.particles,
        ...spawnSplashParticles(this.sceneMetrics.bobberX, this.sceneMetrics.bobberY + 8, 18),
      ];
    }

    if (this.escapeAnim > 0) {
      this.escapeAnim = Math.max(0, this.escapeAnim - dtMs * 0.002);
    }

    this.prevState = this.fishingState;
    this.particles = updateParticles(this.particles);
  }

  setReelHolding(holding: boolean): void {
    this.reelHolding = holding;
  }

  isReelingGame(): boolean {
    return this.fishingState === 'reeling_game';
  }

  consumeSharePending(): Fish | null {
    const fish = this.sharePending;
    this.sharePending = null;
    return fish;
  }

  render(ctx: CanvasRenderingContext2D, L: ScreenLayout): void {
    const env = environments.find((e) => e.id === playerStore.environmentId) ?? environments[0];
    const weather = weathers.find((wt) => wt.id === playerStore.weatherId) ?? weathers[0];
    const m = this.sceneMetrics ?? createSceneMetrics(L.width, L.sceneH);

    ctx.fillStyle = '#3E2731';
    ctx.fillRect(0, L.headerY, L.width, L.headerH);
    ctx.fillStyle = '#E8A838';
    setFont(ctx, 14, true);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    safeFillText(ctx, env.name, 16, L.headerY + 20);
    ctx.fillStyle = '#FFF8E7';
    setFont(ctx, 11);
    safeFillText(
      ctx,
      `${WEATHER_LABEL[playerStore.weatherId]} ${weather.name} · ${TIME_LABEL[playerStore.timeOfDay]}`,
      16,
      L.headerY + 36,
    );
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFD700';
    setFont(ctx, 13, true);
    safeFillText(ctx, `${formatCoins(playerStore.save.coins)} 金币`, L.width - 16, L.headerY + 28);

    ctx.save();
    ctx.translate(this.canvasArea.x, this.canvasArea.y);
    ctx.beginPath();
    ctx.rect(0, 0, this.canvasArea.w, this.canvasArea.h);
    ctx.clip();

    try {
      drawFishingScene(
        ctx,
        m,
        env.id,
        env.skyColor,
        env.waterColor,
        weather,
        this.frame,
        L.safeRight,
        this.fishingState,
        this.caughtFish,
        this.particles,
        this.screenFlash,
        playerStore.timeOfDay,
        this.escapeAnim,
      );
    } catch (err) {
      console.error('[像素钓鱼] 场景渲染失败', err);
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, m.width, m.height);
    }

    const reelGame = this.fsm.getReelGame();
    if (this.fishingState === 'reeling_game' && reelGame) {
      drawReelBar(ctx, this.reelBarRect, reelGame);
    }

    ctx.restore();

    ctx.fillStyle = '#2A4A3A';
    ctx.fillRect(0, L.controlsY, L.width, L.controlsH);

    const statusColor = this.fishingState === 'biting' ? '#FF6B6B' : '#FFF8E7';
    drawTextCenter(ctx, this.statusText, L.width / 2, this.statusY, statusColor, 12);

    const canCast = this.fishingState === 'idle';
    const baitCost = playerStore.getBaitCost();
    const castLabel = this.fishingState === 'casting'
      ? '抛竿中...'
      : this.fishingState === 'waiting'
        ? '等待中...'
        : baitCost > 0
          ? `抛竿\n-${baitCost}金`
          : '抛竿';
    drawPixelButton(ctx, this.castBtn, castLabel, { disabled: !canCast });
    drawPixelButton(ctx, this.envBtn, '环境', { primary: false, small: true });
    drawPixelButton(ctx, this.weatherBtn, '天气', { primary: false, small: true });
    drawPixelButton(ctx, this.timeBtn, TIME_LABEL[playerStore.timeOfDay], { primary: false, small: true });
    drawPixelButton(ctx, this.gearBtn, '装备', { primary: false, small: true });

    if (this.fishingState === 'caught' && this.caughtFish) {
      this.renderCatchModal(ctx, L);
    }

    if (this.showGearPanel) {
      this.renderGearPanel(ctx, L);
    }
  }

  private renderCatchModal(ctx: CanvasRenderingContext2D, L: ScreenLayout): void {
    const fish = this.caughtFish!;
    const panelW = Math.min(300, L.width - 40);
    const panelH = 280;
    const px = (L.width - panelW) / 2;
    const py = L.contentTop + 36;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, L.contentTop, L.width, L.contentBottom - L.contentTop);

    drawPanel(ctx, px, py, panelW, panelH, this.isNewDiscovery ? '新发现!' : '钓到了!');

    const spriteSize = 72;
    const sx = px + panelW / 2 - spriteSize / 2;
    const sy = py + 44;
    ctx.strokeStyle = getRarityBorderColor(fish.rarity);
    ctx.lineWidth = 3;
    ctx.strokeRect(sx - 4, sy - 4, spriteSize + 8, spriteSize + 8);
    ctx.save();
    ctx.translate(sx, sy);
    drawFishPixelArt(ctx, fish, spriteSize, { showBackground: true });
    ctx.restore();

    drawTextCenter(ctx, fish.name, px + panelW / 2, sy + spriteSize + 22, '#3E2731', 17);
    drawTextCenter(ctx, getRarityLabel(fish.rarity), px + panelW / 2, sy + spriteSize + 42, '#888', 12);
    drawTextCenter(
      ctx,
      `+${this.coinsEarned} 金币${this.isNewDiscovery ? ' (首次加倍!)' : ''}`,
      px + panelW / 2,
      sy + spriteSize + 62,
      '#C9922A',
      13,
    );

    ctx.fillStyle = '#555';
    setFont(ctx, 11);
    ctx.textAlign = 'center';
    const desc = fish.description.length > 26 ? `${fish.description.slice(0, 26)}...` : fish.description;
    safeFillText(ctx, desc, px + panelW / 2, sy + spriteSize + 82);

    if (fish.rarity === 'legendary') {
      drawTextCenter(ctx, '可分享给好友!', px + panelW / 2, sy + spriteSize + 102, '#E8A838', 11);
    }

    drawPixelButton(ctx, this.dismissBtn, '继续钓鱼');
  }

  private renderGearPanel(ctx: CanvasRenderingContext2D, L: ScreenLayout): void {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, L.contentTop, L.width, L.contentBottom - L.contentTop);

    const pw = Math.min(320, L.width - 24);
    const ph = 300;
    const px = (L.width - pw) / 2;
    const py = L.contentTop + 30;
    drawPanel(ctx, px, py, pw, ph, '装备');

    let y = py + 52;
    ctx.fillStyle = '#3E2731';
    setFont(ctx, 12, true);
    ctx.textAlign = 'left';
    safeFillText(ctx, '鱼竿', px + 16, y);
    y += 16;

    this.gearRodRects = gearData.rods.map((rod, i) => {
      const owned = (playerStore.save.ownedRodIds ?? ['basic']).includes(rod.id);
      const equipped = playerStore.rodId === rod.id;
      const canBuy = owned || rod.cost === 0 || playerStore.canAfford(rod.cost);
      const label = equipped
        ? `${rod.name} ✓`
        : owned
          ? rod.name
          : rod.cost > 0
            ? `${rod.name} (${rod.cost}金)`
            : rod.name;
      const btn: Rect = { x: px + 12, y: py + 68 + i * 38, w: pw - 24, h: 32 };
      drawPixelButton(ctx, btn, label, { primary: equipped, disabled: !canBuy && !owned, small: true });
      return btn;
    });

    y = py + 68 + gearData.rods.length * 38 + 8;
    safeFillText(ctx, '饵料 (抛竿消耗)', px + 16, y);
    y += 16;

    const baitStartY = y;
    this.gearBaitRects = gearData.baits.map((bait, i) => {
      const selected = playerStore.baitId === bait.id;
      const label = bait.cost > 0 ? `${bait.name} (-${bait.cost}/次)` : bait.name;
      const btn: Rect = { x: px + 12, y: baitStartY + i * 38, w: pw - 24, h: 32 };
      drawPixelButton(ctx, btn, selected ? `${label} ✓` : label, { primary: selected, small: true });
      return btn;
    });

    const closeBtn: Rect = { x: px + pw / 2 - 50, y: py + ph - 44, w: 100, h: 34 };
    drawPixelButton(ctx, closeBtn, '关闭', { primary: false, small: true });
    this.gearCloseBtn = closeBtn;
  }

  private gearCloseBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private gearRodRects: Rect[] = [];
  private gearBaitRects: Rect[] = [];

  handleTap(x: number, y: number): boolean {
    if (this.showGearPanel) {
      if (hitTest(x, y, this.gearCloseBtn)) {
        this.showGearPanel = false;
        playSound('ui');
        return true;
      }
      for (let i = 0; i < this.gearRodRects.length; i++) {
        if (hitTest(x, y, this.gearRodRects[i])) {
          const rod = gearData.rods[i];
          if (playerStore.rodId !== rod.id) {
            playerStore.buyRod(rod.id);
            playSound('ui');
          }
          return true;
        }
      }
      for (let i = 0; i < this.gearBaitRects.length; i++) {
        if (hitTest(x, y, this.gearBaitRects[i])) {
          playerStore.selectBait(gearData.baits[i].id);
          playSound('ui');
          return true;
        }
      }
      return true;
    }

    if (this.fishingState === 'caught' && this.caughtFish) {
      if (hitTest(x, y, this.dismissBtn)) {
        this.fsm.dismissCatch();
        this.caughtFish = null;
        playSound('ui');
        return true;
      }
      this.fsm.dismissCatch();
      this.caughtFish = null;
      return true;
    }

    if (hitTest(x, y, this.castBtn) && this.fishingState === 'idle') {
      if (!playerStore.payForCast()) {
        this.statusText = '金币不足，无法使用饵料！';
        return true;
      }
      this.fsm.cast();
      return true;
    }

    if (hitTest(x, y, this.envBtn)) {
      this.cycleEnvironment();
      playSound('ui');
      return true;
    }

    if (hitTest(x, y, this.weatherBtn)) {
      this.cycleWeather();
      playSound('ui');
      return true;
    }

    if (hitTest(x, y, this.timeBtn)) {
      playerStore.cycleTimeOfDay();
      this.fsm.updateContext(this.gameContext());
      playSound('ui');
      return true;
    }

    if (hitTest(x, y, this.gearBtn)) {
      this.showGearPanel = true;
      playSound('ui');
      return true;
    }

    if (this.fishingState === 'reeling_game') {
      return true;
    }

    if (hitTest(x, y, this.canvasArea) || this.fishingState === 'biting') {
      if (this.fishingState === 'biting') {
        if (playerStore.save.settings.vibration) vibrateReel();
        playSound('reel_ok');
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
    this.fsm.updateContext(this.gameContext());
  }

  private cycleWeather(): void {
    const ids: WeatherId[] = ['sunny', 'cloudy', 'rainy', 'foggy'];
    const idx = ids.indexOf(playerStore.weatherId);
    playerStore.setWeather(ids[(idx + 1) % ids.length]);
    this.fsm.updateContext(this.gameContext());
  }

  destroy(): void {
    this.fsm.destroy();
  }
}
