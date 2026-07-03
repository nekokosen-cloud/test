import type { Fish, FishingState, GameContext } from '@/types';
import { rollFish } from '@/systems/dropTable';

export interface FishingFSMCallbacks {
  onStateChange: (state: FishingState) => void;
  onFishCaught: (fish: Fish, isNew: boolean) => void;
  onFishEscaped: () => void;
  onBite: () => void;
}

export class FishingFSM {
  state: FishingState = 'idle';
  pendingFish: Fish | null = null;
  private waitTimer: ReturnType<typeof setTimeout> | null = null;
  private biteTimer: ReturnType<typeof setTimeout> | null = null;
  private castTimer: ReturnType<typeof setTimeout> | null = null;
  private reelTimer: ReturnType<typeof setTimeout> | null = null;
  private callbacks: FishingFSMCallbacks;
  private context: GameContext;

  constructor(context: GameContext, callbacks: FishingFSMCallbacks) {
    this.context = context;
    this.callbacks = callbacks;
  }

  updateContext(context: GameContext): void {
    this.context = context;
  }

  getState(): FishingState {
    return this.state;
  }

  private setState(state: FishingState): void {
    this.state = state;
    this.callbacks.onStateChange(state);
  }

  cast(): void {
    if (this.state !== 'idle') return;
    this.clearTimers();
    this.pendingFish = rollFish(this.context.environmentId, this.context.weatherId);
    this.setState('casting');

    this.castTimer = setTimeout(() => {
      this.setState('waiting');
      const waitMs = 2000 + Math.random() * 6000;
      this.waitTimer = setTimeout(() => this.triggerBite(), waitMs);
    }, 1000);
  }

  forceBite(): void {
    if (this.state !== 'waiting') return;
    this.clearTimers();
    this.triggerBite();
  }

  private triggerBite(): void {
    if (!this.pendingFish) {
      this.pendingFish = rollFish(this.context.environmentId, this.context.weatherId);
    }
    this.setState('biting');
    this.callbacks.onBite();

    const windowMs = this.pendingFish?.biteWindowMs ?? 1500;
    this.biteTimer = setTimeout(() => {
      if (this.state === 'biting') {
        this.setState('escaped');
        this.callbacks.onFishEscaped();
        this.scheduleReturnToIdle();
      }
    }, windowMs);
  }

  reel(): void {
    if (this.state !== 'biting') return;
    this.clearTimers();
    this.setState('reeling');

    this.reelTimer = setTimeout(() => {
      if (this.pendingFish) {
        this.setState('caught');
        // isNew will be determined by store
        this.callbacks.onFishCaught(this.pendingFish, false);
      }
      this.scheduleReturnToIdle(2500);
    }, 800);
  }

  dismissCatch(): void {
    if (this.state === 'caught' || this.state === 'escaped') {
      this.clearTimers();
      this.setState('idle');
      this.pendingFish = null;
    }
  }

  private scheduleReturnToIdle(delay = 1500): void {
    this.reelTimer = setTimeout(() => {
      if (this.state === 'escaped') {
        this.setState('idle');
        this.pendingFish = null;
      }
    }, delay);
  }

  private clearTimers(): void {
    if (this.waitTimer) clearTimeout(this.waitTimer);
    if (this.biteTimer) clearTimeout(this.biteTimer);
    if (this.castTimer) clearTimeout(this.castTimer);
    if (this.reelTimer) clearTimeout(this.reelTimer);
    this.waitTimer = null;
    this.biteTimer = null;
    this.castTimer = null;
    this.reelTimer = null;
  }

  destroy(): void {
    this.clearTimers();
  }
}
