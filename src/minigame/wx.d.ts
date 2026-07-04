/// <reference types="@types/wechat-miniprogram" />

export {};

interface MinigameTouch {
  clientX: number;
  clientY: number;
}

interface MinigameTouchEvent {
  touches: MinigameTouch[];
  changedTouches: MinigameTouch[];
}

interface MinigameWx extends WechatMiniprogram.Wx {
  createCanvas(): WechatMiniprogram.Canvas;
  onTouchStart(callback: (e: MinigameTouchEvent) => void): void;
  onTouchMove(callback: (e: MinigameTouchEvent) => void): void;
  onTouchEnd(callback: (e: MinigameTouchEvent) => void): void;
}

declare const wx: MinigameWx;

declare function requestAnimationFrame(callback: FrameRequestCallback): number;
declare function cancelAnimationFrame(handle: number): void;

declare namespace WechatMiniprogram {
  interface Canvas {
    width: number;
    height: number;
    getContext(contextType: '2d'): CanvasRenderingContext2D | null;
    requestAnimationFrame?(callback: FrameRequestCallback): number;
    cancelAnimationFrame?(handle: number): void;
  }
}
