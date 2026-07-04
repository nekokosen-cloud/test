/** 微信小游戏屏幕布局（安全区 + 分区） */
export interface ScreenLayout {
  width: number;
  height: number;
  topInset: number;
  bottomInset: number;
  headerH: number;
  headerY: number;
  tabH: number;
  tabY: number;
  contentTop: number;
  contentBottom: number;
  contentH: number;
  sceneY: number;
  sceneH: number;
  controlsY: number;
  controlsH: number;
  /** 右侧留白，避开微信胶囊按钮 */
  safeRight: number;
}

const HEADER_H = 44;
const TAB_BASE_H = 44;
const CONTROLS_H = 112;

export function createScreenLayout(info: WechatMiniprogram.SystemInfo): ScreenLayout {
  const width = info.windowWidth || info.screenWidth || 375;
  const height = info.windowHeight || info.screenHeight || 667;
  const safe = info.safeArea;

  const topInset = Math.max(0, safe?.top ?? info.statusBarHeight ?? 0);
  const bottomInset = safe
    ? Math.max(0, height - safe.bottom)
    : 0;

  const headerY = topInset;
  const tabH = TAB_BASE_H + Math.max(bottomInset, 6);
  const tabY = height - tabH;
  const contentTop = headerY + HEADER_H;
  const contentBottom = tabY;
  const contentH = Math.max(200, contentBottom - contentTop);

  const controlsH = CONTROLS_H;
  const sceneH = Math.max(180, contentH - controlsH);
  const sceneY = contentTop;
  const controlsY = sceneY + sceneH;

  return {
    width,
    height,
    topInset,
    bottomInset,
    headerH: HEADER_H,
    headerY,
    tabH,
    tabY,
    contentTop,
    contentBottom,
    contentH,
    sceneY,
    sceneH,
    controlsY,
    controlsH,
    safeRight: 96,
  };
}

/** 钓鱼场景内元素坐标（相对场景区域） */
export interface SceneMetrics {
  width: number;
  height: number;
  waterY: number;
  bobberX: number;
  bobberY: number;
  rodTipX: number;
  rodTipY: number;
  fisherX: number;
  fisherY: number;
  scale: number;
}

export function createSceneMetrics(sceneW: number, sceneH: number): SceneMetrics {
  const scale = Math.max(0.75, Math.min(sceneW / 375, sceneH / 300));
  const waterY = Math.floor(sceneH * 0.56);
  const fisherX = Math.floor(sceneW * 0.06);
  const fisherY = waterY - Math.floor(36 * scale);
  const rodTipX = Math.floor(sceneW * 0.22);
  const rodTipY = waterY - Math.floor(22 * scale);
  const bobberX = Math.floor(sceneW * 0.55);
  const bobberY = waterY - Math.floor(6 * scale);

  return {
    width: sceneW,
    height: sceneH,
    waterY,
    bobberX,
    bobberY,
    rodTipX,
    rodTipY,
    fisherX,
    fisherY,
    scale,
  };
}
