import type { KoiSkin } from '@/types';
import { koiStore } from '@/minigame/store/koiStore';
import { playerStore } from '@/minigame/store/playerStore';
import { playSound } from '@/minigame/adapters/audio';
import { vibrateBite as vibratePet } from '@/minigame/adapters/vibration';
import { WARN_FULLNESS } from '@/game/koi/koiSimulation';
import {
  createKoiSwim,
  drawHeartBurst,
  drawKoiFish,
  drawKoiPond,
  drawStatBar,
  updateKoiSwim,
  type KoiSwimState,
} from '@/minigame/renderer/koiSceneDraw';
import { drawPanel, drawPixelButton, drawTextCenter, hitTest, type Rect } from '@/minigame/ui/canvasUI';
import type { ScreenLayout } from '@/minigame/layout/screenLayout';

export class KoiScreen {
  private swim: KoiSwimState | null = null;
  private frame = 0;
  private feedBurst = 0;
  private petBurst = 0;
  private showAdoptModal = false;
  private showReviveModal = false;
  private pondArea: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private feedBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private petBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private adoptBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private reviveBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private statusY = 0;

  layout(L: ScreenLayout): void {
    const pondH = Math.floor(L.contentH * 0.55);
    this.pondArea = { x: 0, y: L.contentTop, w: L.width, h: pondH };
    const cy = L.contentTop + pondH + 8;
    this.statusY = cy + 12;
    const half = (L.width - 48) / 2;
    this.feedBtn = { x: 16, y: cy + 100, w: half, h: 40 };
    this.petBtn = { x: 32 + half, y: cy + 100, w: half, h: 40 };
    this.adoptBtn = { x: L.width / 2 - 70, y: L.contentTop + L.contentH / 2, w: 140, h: 42 };
    this.reviveBtn = { x: L.width / 2 - 70, y: L.contentTop + L.contentH / 2 + 50, w: 140, h: 42 };

    if (!this.swim) {
      this.swim = createKoiSwim(this.pondArea.w, this.pondArea.h);
    }
  }

  onShow(): void {
    koiStore.startTicking();
    koiStore.tick();
    const koi = koiStore.getKoi();
    if (!koi) this.showAdoptModal = true;
    else if (!koi.isAlive) this.showReviveModal = true;
  }

  onHide(): void {
    koiStore.stopTicking();
  }

  update(dtMs = 16): void {
    this.frame += 1;
    if (this.feedBurst > 0) this.feedBurst -= dtMs * 0.003;
    if (this.petBurst > 0) this.petBurst -= dtMs * 0.004;

    const koi = koiStore.getKoi();
    if (koi?.isAlive && this.swim) {
      this.swim = updateKoiSwim(this.swim, this.pondArea.w, this.pondArea.h, dtMs, this.feedBurst);
    }
  }

  render(ctx: CanvasRenderingContext2D, L: ScreenLayout): void {
    const koi = koiStore.getKoi();
    const hasGold = playerStore.isDiscovered('gold_koi');
    const skin: KoiSkin = hasGold ? 'gold' : 'common';

    ctx.fillStyle = '#3E2731';
    ctx.fillRect(0, L.headerY, L.width, L.headerH);
    drawTextCenter(ctx, '锦鲤池塘', L.width / 2, L.headerY + 22, '#E8A838', 16);
    if (koi) {
      drawTextCenter(
        ctx,
        `${koi.name} · ${koiStore.getStageName(koi.growthStage)}`,
        L.width / 2,
        L.headerY + 38,
        '#FFF8E7',
        11,
      );
    }

    ctx.save();
    ctx.translate(this.pondArea.x, this.pondArea.y);
    ctx.beginPath();
    ctx.rect(0, 0, this.pondArea.w, this.pondArea.h);
    ctx.clip();
    drawKoiPond(ctx, this.pondArea.w, this.pondArea.h, this.frame);

    if (koi && this.swim) {
      const bloated = koi.fullness >= WARN_FULLNESS;
      drawKoiFish(ctx, koi, this.swim, bloated);
      if (this.petBurst > 0) {
        drawHeartBurst(ctx, this.swim.x, this.swim.y - 20, this.frame, this.petBurst);
      }
    }
    ctx.restore();

    ctx.fillStyle = '#2A4A3A';
    ctx.fillRect(0, this.pondArea.y + this.pondArea.h, L.width, L.contentBottom - this.pondArea.y - this.pondArea.h);

    drawTextCenter(ctx, koiStore.getStatusMessage(), L.width / 2, this.statusY, '#FFF8E7', 12);

    if (koi?.isAlive) {
      const sx = 16;
      let sy = this.statusY + 24;
      const barW = L.width - 32;
      drawStatBar(ctx, sx, sy, barW, '饱', koi.fullness, '#5FA088');
      sy += 18;
      drawStatBar(ctx, sx, sy, barW, '饿', koi.hunger, '#E8A838');
      sy += 18;
      drawStatBar(ctx, sx, sy, barW, '心', koi.happiness, '#FF6B8A');
      sy += 18;
      drawStatBar(ctx, sx, sy, barW, '健', koi.health, '#6BB5E0');

      drawPixelButton(ctx, this.feedBtn, '喂食', { primary: true });
      drawPixelButton(ctx, this.petBtn, '摸摸', { primary: false });
    } else if (!koi) {
      drawTextCenter(ctx, '还没有锦鲤，快来领养吧！', L.width / 2, this.statusY + 60, '#AAA', 13);
    } else if (!koi.isAlive) {
      drawTextCenter(ctx, koi.deathMessage || '它已经不在了…', L.width / 2, this.statusY + 40, '#FF6B6B', 13);
    }

    if (this.showAdoptModal) {
      this.renderAdoptModal(ctx, L, skin);
    }
    if (this.showReviveModal && koi && !koi.isAlive) {
      this.renderReviveModal(ctx, L, skin);
    }
  }

  private renderAdoptModal(ctx: CanvasRenderingContext2D, L: ScreenLayout, skin: KoiSkin): void {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, L.contentTop, L.width, L.contentBottom - L.contentTop);
    const pw = 260;
    const ph = 180;
    const px = (L.width - pw) / 2;
    const py = L.contentTop + 80;
    drawPanel(ctx, px, py, pw, ph, '领养锦鲤');
    drawTextCenter(ctx, skin === 'gold' ? '金色皮肤已解锁!' : '普通锦鲤', px + pw / 2, py + 56, '#555', 12);
    drawTextCenter(ctx, '给它取个名字吧~', px + pw / 2, py + 80, '#888', 11);
    drawTextCenter(ctx, '默认: 小金', px + pw / 2, py + 100, '#AAA', 11);
    drawPixelButton(ctx, this.adoptBtn, '领养「小金」');
  }

  private renderReviveModal(ctx: CanvasRenderingContext2D, L: ScreenLayout, skin: KoiSkin): void {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, L.contentTop, L.width, L.contentBottom - L.contentTop);
    const pw = 260;
    const ph = 160;
    const px = (L.width - pw) / 2;
    const py = L.contentTop + 100;
    drawPanel(ctx, px, py, pw, ph, '重新开始');
    drawTextCenter(ctx, '要再养一条锦鲤吗？', px + pw / 2, py + 60, '#555', 12);
    drawPixelButton(ctx, this.reviveBtn, skin === 'gold' ? '领养金锦鲤' : '领养新锦鲤');
  }

  handleTap(x: number, y: number): boolean {
    if (this.showAdoptModal) {
      if (hitTest(x, y, this.adoptBtn)) {
        const skin: KoiSkin = playerStore.isDiscovered('gold_koi') ? 'gold' : 'common';
        koiStore.adoptKoi('小金', skin);
        this.showAdoptModal = false;
        playSound('ui');
        return true;
      }
      return true;
    }

    if (this.showReviveModal) {
      if (hitTest(x, y, this.reviveBtn)) {
        const skin: KoiSkin = playerStore.isDiscovered('gold_koi') ? 'gold' : 'common';
        koiStore.revive('小金', skin);
        this.showReviveModal = false;
        playSound('ui');
        return true;
      }
      return true;
    }

    const koi = koiStore.getKoi();
    if (koi?.isAlive) {
      if (hitTest(x, y, this.feedBtn)) {
        const result = koiStore.feed();
        if (!result.died) this.feedBurst = 1;
        playSound('ui');
        return true;
      }
      if (hitTest(x, y, this.petBtn)) {
        const result = koiStore.pet();
        if (result.ok) {
          this.petBurst = 1;
          if (playerStore.save.settings.vibration) vibratePet();
        }
        playSound('ui');
        return true;
      }
      if (hitTest(x, y, this.pondArea)) {
        const result = koiStore.pet();
        if (result.ok) {
          this.petBurst = 1;
          if (playerStore.save.settings.vibration) vibratePet();
        }
        return true;
      }
    }

    return false;
  }
}
