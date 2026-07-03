import { useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { Environment, FishingState, Fish, Particle, Weather } from '@/types';
import {
  drawSky,
  drawWaterSurface,
  drawEnvironmentDecor,
  drawBobber,
  drawRod,
  drawFishShadow,
  drawParticles,
  drawScreenFlash,
  drawFishSprite,
  spawnSplashParticles,
  updateParticles,
  PIXEL,
} from '@/game/renderer/pixelRenderer';

interface PixelCanvasProps {
  width: number;
  height: number;
  environment: Environment;
  weather: Weather;
  fishingState: FishingState;
  caughtFish: Fish | null;
  onCanvasTap: () => void;
  screenFlash: number;
}

export default function PixelCanvas({
  width,
  height,
  environment,
  weather,
  fishingState,
  caughtFish,
  onCanvasTap,
  screenFlash,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const prevStateRef = useRef<FishingState>('idle');
  const waterY = Math.floor(height * 0.45);
  const bobberX = width / 2;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    frameRef.current += 1;
    const frame = frameRef.current;

    // detect bite transition for splash
    if (fishingState === 'biting' && prevStateRef.current !== 'biting') {
      particlesRef.current = [
        ...particlesRef.current,
        ...spawnSplashParticles(bobberX, waterY, 15),
      ];
    }
    prevStateRef.current = fishingState;

    particlesRef.current = updateParticles(particlesRef.current);

    // clear
    ctx.clearRect(0, 0, width, height);

    // sky
    drawSky(ctx, width, waterY, environment.skyColor, weather, frame);

    // decor
    drawEnvironmentDecor(ctx, environment.id, width, waterY);

    // water
    drawWaterSurface(ctx, width, waterY, environment.waterColor, frame);

    // fish shadow during bite/waiting
    if (fishingState === 'waiting' || fishingState === 'biting') {
      const alpha = fishingState === 'biting' ? 0.7 : 0.25;
      drawFishShadow(ctx, bobberX, waterY + 20, alpha, frame);
    }

    // rod & character
    drawRod(ctx, frame);

    // bobber
    const showBobber = ['waiting', 'biting', 'reeling'].includes(fishingState);
    if (showBobber) {
      drawBobber(ctx, bobberX, waterY - 10, fishingState === 'biting', frame);
    }

    // caught fish animation
    if (fishingState === 'caught' && caughtFish) {
      const bounce = Math.abs(Math.sin(frame * 0.15)) * 10;
      drawFishSprite(ctx, bobberX - 20, waterY - 60 - bounce, caughtFish, 1.5);
    }

    // particles
    drawParticles(ctx, particlesRef.current);

    // screen flash for bite feedback
    drawScreenFlash(ctx, width, height, screenFlash);
  }, [width, height, environment, weather, fishingState, caughtFish, screenFlash, waterY, bobberX]);

  useEffect(() => {
    const loop = () => {
      render();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  useEffect(() => {
    if (process.env.TARO_ENV === 'h5') {
      const el = document.getElementById('fishing-canvas') as HTMLCanvasElement | null;
      if (el) canvasRef.current = el;
    }
  }, []);

  const handleTap = () => {
    onCanvasTap();
  };

  if (process.env.TARO_ENV === 'h5') {
    return (
      <canvas
        id="fishing-canvas"
        width={width}
        height={height}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          imageRendering: 'pixelated',
          display: 'block',
        }}
        onClick={handleTap}
      />
    );
  }

  return (
    <Canvas
      type="2d"
      id="fishing-canvas"
      canvasId="fishing-canvas"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      onTouchStart={handleTap}
      onReady={() => {
        Taro.createSelectorQuery()
          .select('#fishing-canvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            const node = res[0]?.node as HTMLCanvasElement | undefined;
            if (node) {
              node.width = width;
              node.height = height;
              canvasRef.current = node;
            }
          });
      }}
    />
  );
}

export { PIXEL };
