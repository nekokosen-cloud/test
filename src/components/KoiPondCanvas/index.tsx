import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, View, Text } from '@tarojs/components';
import type { KoiParticle, KoiState } from '@/types';
import {
  drawKoi,
  drawKoiParticles,
  drawPondBackground,
  getKoiPosition,
  isTapOnKoi,
  spawnBubbleParticle,
  spawnFoodParticles,
  spawnHeartParticles,
  updateKoiParticles,
} from '@/game/koi/koiRenderer';
import { initCanvas2d, startCanvasLoop } from '@/utils/weappCanvas';

const FEED_ANIM_FRAMES = 90;
const CANVAS_ID = 'koi-pond-canvas';

interface KoiPondCanvasProps {
  width: number;
  height: number;
  koi: KoiState;
  onPet: () => void;
  feedTrigger: number;
  petTrigger: number;
}

export default function KoiPondCanvas({
  width,
  height,
  koi,
  onPet,
  feedTrigger,
  petTrigger,
}: KoiPondCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef(0);
  const particlesRef = useRef<KoiParticle[]>([]);
  const petBurstRef = useRef(0);
  const feedBurstRef = useRef(0);
  const prevFeedTrigger = useRef(feedTrigger);
  const prevPetTrigger = useRef(petTrigger);
  const bubbleTimerRef = useRef(0);
  const [canvasReady, setCanvasReady] = useState(process.env.TARO_ENV === 'h5');

  const makeDrawParams = (frame: number) => ({
    koi,
    width,
    height,
    frame,
    petBurst: petBurstRef.current,
    feedBurst: feedBurstRef.current,
  });

  useEffect(() => {
    if (feedTrigger !== prevFeedTrigger.current) {
      prevFeedTrigger.current = feedTrigger;
      feedBurstRef.current = FEED_ANIM_FRAMES;
      const pos = getKoiPosition(makeDrawParams(frameRef.current));
      particlesRef.current = [
        ...particlesRef.current,
        ...spawnFoodParticles(pos.x, pos.y, pos.angle),
      ];
    }
  }, [feedTrigger, koi, width, height]);

  useEffect(() => {
    if (petTrigger !== prevPetTrigger.current) {
      prevPetTrigger.current = petTrigger;
      petBurstRef.current = 40;
      const pos = getKoiPosition(makeDrawParams(frameRef.current));
      particlesRef.current = [...particlesRef.current, ...spawnHeartParticles(pos.x, pos.y)];
    }
  }, [petTrigger, koi, width, height]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    frameRef.current += 1;
    const frame = frameRef.current;

    if (petBurstRef.current > 0) petBurstRef.current -= 1;
    if (feedBurstRef.current > 0) feedBurstRef.current -= 1;

    particlesRef.current = updateKoiParticles(particlesRef.current);

    bubbleTimerRef.current += 1;
    if (koi.isAlive && (koi.hunger >= 70 || koi.happiness >= 75) && bubbleTimerRef.current % 120 === 0) {
      const pos = getKoiPosition(makeDrawParams(frame));
      particlesRef.current = [...particlesRef.current, spawnBubbleParticle(pos.x, pos.y)];
    }

    ctx.clearRect(0, 0, width, height);
    drawPondBackground(ctx, width, height, frame);
    drawKoi(ctx, makeDrawParams(frame));
    drawKoiParticles(ctx, particlesRef.current);
  }, [width, height, koi]);

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

  const handleTap = (tapX: number, tapY: number) => {
    if (!koi.isAlive) return;
    if (isTapOnKoi(tapX, tapY, makeDrawParams(frameRef.current))) {
      onPet();
    }
  };

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
        }}
        onClick={(e) => {
          const el = e.currentTarget as HTMLCanvasElement;
          const rect = el.getBoundingClientRect();
          handleTap(
            (e.clientX - rect.left) * (width / rect.width),
            (e.clientY - rect.top) * (height / rect.height),
          );
        }}
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
          <Text className="pixel-canvas-fallback__text">加载池塘中...</Text>
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
        onTouchStart={(e) => {
          const touch = e.touches?.[0];
          if (touch) {
            handleTap(touch.x, touch.y);
          }
        }}
        onReady={setupWeappCanvas}
      />
    </View>
  );
}

export { KoiPondCanvas };
