import { useEffect, useId } from 'react';
import { Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { Fish } from '@/types';
import { drawFishPixelArt, getFishSpriteDataUrl } from '@/game/renderer/fishSprites';

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
  const uid = useId().replace(/:/g, '');
  const canvasId = `fish-sprite-${fish.id}-${size}-${uid}`;

  const renderToCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFishPixelArt(ctx, fish, size, { silhouette, showBackground: true });
  };

  useEffect(() => {
    if (process.env.TARO_ENV === 'h5') {
      const el = document.getElementById(canvasId) as HTMLCanvasElement | null;
      renderToCanvas(el);
    }
  }, [fish, size, silhouette, canvasId]);

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    imageRendering: 'pixelated' as const,
    display: 'block',
  };

  if (process.env.TARO_ENV === 'h5') {
    const dataUrl = getFishSpriteDataUrl(fish, size, silhouette);
    return (
      <img
        src={dataUrl}
        alt={fish.name}
        className={className}
        style={style}
        width={size}
        height={size}
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
            if (node) {
              node.width = size;
              node.height = size;
              renderToCanvas(node);
            }
          });
      }}
    />
  );
}

export { FishSprite };
