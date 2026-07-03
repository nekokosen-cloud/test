import Taro from '@tarojs/taro';

const SAVE_KEY = 'pixel_fishing_save';

export function vibrateBite(): void {
  try {
    if (process.env.TARO_ENV === 'weapp') {
      Taro.vibrateShort({ type: 'heavy' });
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  } catch {
    // vibration not supported
  }
}

export function vibratePet(): void {
  try {
    if (process.env.TARO_ENV === 'weapp') {
      Taro.vibrateShort({ type: 'light' });
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }
  } catch {
    // vibration not supported
  }
}

export function vibrateReel(): void {
  try {
    if (process.env.TARO_ENV === 'weapp') {
      Taro.vibrateShort({ type: 'medium' });
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }
  } catch {
    // vibration not supported
  }
}

export function isVibrationSupported(): boolean {
  if (process.env.TARO_ENV === 'weapp') return true;
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export { SAVE_KEY };
