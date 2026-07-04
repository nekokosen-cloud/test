import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, View, Text } from '@tarojs/components';
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
} from '@/game/renderer/pixelRenderer';
import { initCanvas2d, startCanvasLoop } from '@/utils/weappCanvas';

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

const CANVAS_ID = 'fishing-canvas';

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
  const prevStateRef = useRef<FishingState>('idle');
  const [canvasReady, setCanvasReady] = useState(process.env.TARO_ENV === 'h5');
  const waterY = Math.floor(height * 0.45);
  const bobberX = width / 2;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameRef.current += 1;
    const frame = frameRef.current;

    if (fishingState === 'biting' && prevStateRef.current !== 'biting') {
      particlesRef.current = [
        ...particlesRef.current,
        ...spawnSplashParticles(bobberX, waterY, 15),
      ];
    }
    prevStateRef.current = fishingState;
    particlesRef.current = updateParticles(particlesRef.current);

    ctx.clearRect(0, 0, width, height);
    drawSky(ctx, width, waterY, environment.skyColor, weather, frame);
    drawEnvironmentDecor(ctx, environment.id, width, waterY);
    drawWaterSurface(ctx, width, waterY, environment.waterColor, frame);

    if (fishingState === 'waiting' || fishingState === 'biting') {
      const alpha = fishingState === 'biting' ? 0.7 : 0.25;
      drawFishShadow(ctx, bobberX, waterY + 20, alpha, frame);
    }

    drawRod(ctx, frame);

    if (['waiting', 'biting', 'reeling'].includes(fishingState)) {
      drawBobber(ctx, bobberX, waterY - 10, fishingState === 'biting', frame);
    }

    if (fishingState === 'caught' && caughtFish) {
      const bounce = Math.abs(Math.sin(frame * 0.15)) * 10;
      drawFishSprite(ctx, bobberX - 20, waterY - 60 - bounce, caughtFish, 1.5);
    }

    drawParticles(ctx, particlesRef.current);
    drawScreenFlash(ctx, width, height, screenFlash);
  }, [width, height, environment, weather, fishingState, caughtFish, screenFlash, waterY, bobberX]);

  useEffect(() => {
    if (process.env.TARO_ENV === 'h5') {
      const el = document.getElementById(CANVAS_ID) as HTMLCanvasElement | null;
      if (el) {
        el.width = width;
        el.height = height;
        canvasRef.current = el;
        setCanvasReady(true);
      }
    }
  }, [width, height]);

  useEffect(() => {
    if (!canvasReady || !canvasRef.current) return;

    if (process.env.TARO_ENV === 'h5') {
      let animId = 0;
      const loop = () => {
        render();
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animId);
    }

    return startCanvasLoop(canvasRef.current, render);
  }, [canvasReady, render]);

  const setupWeappCanvas = useCallback(async () => {
    const result = await initCanvas2d(`#${CANVAS_ID}`, width, height);
    if (result) {
      canvasRef.current = result.canvas;
      setCanvasReady(true);
    }
  }, [width, height]);

  if (process.env.TARO_ENV === 'h5') {
    return (
      <canvas
        id={CANVAS_ID}
        width={width}
        height={height}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          imageRendering: 'pixelated',
          display: 'block',
          background: '#87CEEB',
        }}
        onClick={onCanvasTap}
      />
    );
  }

  return (
    <View className="pixel-canvas-wrap">
      {!canvasReady && (
        <View
          className="pixel-canvas-fallback"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <Text className="pixel-canvas-fallback__text">加载场景中...</Text>
        </View>
      )}
      <Canvas
        type="2d"
        id={CANVAS_ID}
        canvasId={CANVAS_ID}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: canvasReady ? 'block' : 'none',
        }}
        onTouchStart={onCanvasTap}
        onReady={setupWeappCanvas}
      />
    </View>
  );
}
