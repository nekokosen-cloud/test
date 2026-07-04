import Taro, { getCurrentInstance } from '@tarojs/taro';

export interface Canvas2dResult {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
}

export function initCanvas2d(
  selector: string,
  width: number,
  height: number,
): Promise<Canvas2dResult | null> {
  return new Promise((resolve) => {
    const tryInit = (attempt: number) => {
      const instance = getCurrentInstance();
      let query = Taro.createSelectorQuery();
      if (instance) {
        query = query.in(instance);
      }

      query
        .select(selector)
        .fields({ node: true, size: true })
        .exec((res) => {
          const node = res?.[0]?.node as HTMLCanvasElement | undefined;
          if (!node) {
            if (attempt < 5) {
              setTimeout(() => tryInit(attempt + 1), 80 * (attempt + 1));
            } else {
              resolve(null);
            }
            return;
          }

          const ctx = node.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          const dpr = Taro.getSystemInfoSync().pixelRatio || 2;
          node.width = Math.floor(width * dpr);
          node.height = Math.floor(height * dpr);
          ctx.scale(dpr, dpr);
          ctx.imageSmoothingEnabled = false;

          resolve({ canvas: node, ctx, dpr });
        });
    };

    Taro.nextTick(() => tryInit(0));
  });
}

export function startCanvasLoop(
  canvas: HTMLCanvasElement,
  draw: () => void,
): () => void {
  let stopped = false;
  let handle = 0;

  const tick = () => {
    if (stopped) return;
    draw();
    if (typeof canvas.requestAnimationFrame === 'function') {
      handle = canvas.requestAnimationFrame(tick);
    } else {
      handle = requestAnimationFrame(tick) as unknown as number;
    }
  };

  tick();

  return () => {
    stopped = true;
    if (typeof canvas.cancelAnimationFrame === 'function') {
      canvas.cancelAnimationFrame(handle);
    } else {
      cancelAnimationFrame(handle);
    }
  };
}
