type SoundId = 'cast' | 'splash' | 'bite' | 'reel_ok' | 'reel_fail' | 'ui' | 'catch';

const SOUND_FREQ: Record<SoundId, number> = {
  cast: 220,
  splash: 180,
  bite: 440,
  reel_ok: 523,
  reel_fail: 160,
  ui: 300,
  catch: 660,
};

let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

function playTone(freq: number, durationMs: number): void {
  if (!enabled) return;
  try {
    const mg = wx as { createWebAudioContext?: () => AudioContext };
    const ctx = mg.createWebAudioContext?.();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // WebAudio 不可用时静默
  }
}

export function playSound(id: SoundId): void {
  playTone(SOUND_FREQ[id] ?? 300, id === 'catch' ? 180 : 90);
}

export function syncSoundFromSettings(on: boolean): void {
  setSoundEnabled(on);
}
