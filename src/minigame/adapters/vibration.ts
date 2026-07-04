export function vibrateBite(): void {
  try {
    wx.vibrateShort({ type: 'heavy' });
  } catch {
    // ignore
  }
}

export function vibrateReel(): void {
  try {
    wx.vibrateShort({ type: 'medium' });
  } catch {
    // ignore
  }
}
