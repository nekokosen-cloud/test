import { useEffect, useRef } from 'react';
import { Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { Fish } from '@/types';
import { drawFishPixelArt } from '@/game/renderer/fishSprites';

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

  const paint = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFishPixelArt(ctx, fish, size, { silhouette, showBackground: true });
  };

  useEffect(() => {
    if (process.env.TARO_ENV === 'h5') {
      paint(canvasRef.current);
    }
  }, [fish.id, fish.color, fish.accentColor, size, silhouette]);

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
        id={canvasId}
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
      onReady={() => {
        Taro.createSelectorQuery()
          .select(`#${canvasId}`)
          .fields({ node: true, size: true })
          .exec((res) => {
            const node = res[0]?.node as HTMLCanvasElement | undefined;
            if (node) paint(node);
          });
      }}
    />
  );
}

export { FishSprite };
