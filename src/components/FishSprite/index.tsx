import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas } from '@tarojs/components';
import type { Fish } from '@/types';
import { drawFishPixelArt } from '@/game/renderer/fishSprites';
import { initCanvas2d } from '@/utils/weappCanvas';

interface FishSpriteProps {
  fish: Fish;
  size?: number;
  silhouette?: boolean;
  className?: string;
}

export default function FishSprite({
  fish,
  size = 48,
  silhouette = false,
  className = '',
}: FishSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasId = `fish-${fish.id}-${size}-${silhouette ? 's' : 'c'}`;

  const paint = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFishPixelArt(ctx, fish, size, { silhouette, showBackground: true });
  }, [fish, size, silhouette]);

  useEffect(() => {
    if (process.env.TARO_ENV === 'h5') {
      paint(canvasRef.current);
    }
  }, [paint]);

  const setupWeappCanvas = useCallback(async () => {
    const result = await initCanvas2d(`#${canvasId}`, size, size);
    if (result) {
      canvasRef.current = result.canvas;
      paint(result.canvas);
    }
  }, [canvasId, size, paint]);

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    imageRendering: 'pixelated' as const,
    display: 'block',
  };

  if (process.env.TARO_ENV === 'h5') {
    return (
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className={className}
        style={style}
      />
    );
  }

  return (
    <Canvas
      type="2d"
      id={canvasId}
      canvasId={canvasId}
      className={className}
      style={style}
      onReady={setupWeappCanvas}
    />
  );
}

export { FishSprite };
