import { safeFillText, setFont } from '@/minigame/ui/fonts';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function hitTest(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function drawPixelButton(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  label: string,
  options: { primary?: boolean; disabled?: boolean; small?: boolean } = {},
): void {
  const { primary = true, disabled = false, small = false } = options;
  const bg = disabled ? '#888' : primary ? '#E8A838' : '#5FA088';
  const textColor = disabled ? '#CCC' : primary ? '#3E2731' : '#FFFFFF';

  ctx.fillStyle = bg;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = '#3E2731';
  ctx.lineWidth = small ? 2 : 3;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  ctx.fillStyle = textColor;
  setFont(ctx, small ? 12 : 14);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = label.split('\n');
  if (lines.length > 1) {
    const lineH = small ? 14 : 16;
    const startY = rect.y + rect.h / 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((line, i) => {
      safeFillText(ctx, line, rect.x + rect.w / 2, startY + i * lineH);
    });
  } else {
    safeFillText(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
}

export function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string,
): void {
  ctx.fillStyle = '#FFF8E7';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#3E2731';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  if (title) {
    ctx.fillStyle = '#3E2731';
    setFont(ctx, 16, true);
    ctx.textAlign = 'center';
    safeFillText(ctx, title, x + w / 2, y + 24);
    ctx.strokeStyle = '#E8A838';
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 36);
    ctx.lineTo(x + w - 12, y + 36);
    ctx.stroke();
  }
}

export function drawHeader(
  ctx: CanvasRenderingContext2D,
  w: number,
  title: string,
  subtitle: string,
): void {
  ctx.fillStyle = '#3E2731';
  ctx.fillRect(0, 0, w, 52);
  ctx.fillStyle = '#E8A838';
  setFont(ctx, 16, true);
  ctx.textAlign = 'left';
  safeFillText(ctx, title, 16, 22);
  ctx.fillStyle = '#FFF8E7';
  setFont(ctx, 13);
  safeFillText(ctx, subtitle, 16, 40);
}

export function drawTabBar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  y: number,
  active: 'fishing' | 'encyclopedia',
): Rect[] {
  const tabs = [
    { id: 'fishing' as const, label: '钓鱼' },
    { id: 'encyclopedia' as const, label: '图鉴' },
  ];
  const tabW = w / tabs.length;
  const rects: Rect[] = [];

  ctx.fillStyle = '#3E2731';
  ctx.fillRect(0, y, w, h);

  tabs.forEach((tab, i) => {
    const rect = { x: i * tabW, y, w: tabW, h };
    rects.push(rect);
    if (tab.id === active) {
      ctx.fillStyle = '#E8A838';
      ctx.fillRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
    }
    ctx.fillStyle = tab.id === active ? '#3E2731' : '#AAA';
    setFont(ctx, 14, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    safeFillText(ctx, tab.label, rect.x + rect.w / 2, rect.y + rect.h / 2);
  });

  return rects;
}

export function drawTextCenter(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = '#FFF8E7',
  size = 14,
): void {
  ctx.fillStyle = color;
  setFont(ctx, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  safeFillText(ctx, text, x, y);
}
