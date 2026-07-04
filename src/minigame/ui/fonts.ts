/** 微信小游戏 Canvas 不支持 monospace，需用系统字体 */
export const FONT_FAMILY = 'sans-serif';

export function setFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  bold = false,
): void {
  ctx.font = bold ? `bold ${size}px ${FONT_FAMILY}` : `${size}px ${FONT_FAMILY}`;
}

export function safeFillText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
): void {
  try {
    ctx.fillText(text, x, y);
  } catch (err) {
    console.warn('[像素钓鱼] 文字渲染失败:', text, err);
  }
}
