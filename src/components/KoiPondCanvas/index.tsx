import { useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
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

const FEED_ANIM_FRAMES = 90;

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
  const animRef = useRef(0);
  const particlesRef = useRef<KoiParticle[]>([]);
  const petBurstRef = useRef(0);
  const feedBurstRef = useRef(0);
  const prevFeedTrigger = useRef(feedTrigger);
  const prevPetTrigger = useRef(petTrigger);
  const bubbleTimerRef = useRef(0);

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
    const loop = () => {
      render();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  useEffect(() => {
    if (process.env.TARO_ENV === 'h5') {
      const el = document.getElementById('koi-pond-canvas') as HTMLCanvasElement | null;
      if (el) canvasRef.current = el;
    }
  }, []);

  const handleTap = (clientX: number, clientY: number) => {
    if (!koi.isAlive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const tapX = (clientX - rect.left) * scaleX;
    const tapY = (clientY - rect.top) * scaleY;

    if (isTapOnKoi(tapX, tapY, makeDrawParams(frameRef.current))) {
      onPet();
    }
  };

  if (process.env.TARO_ENV === 'h5') {
    return (
      <canvas
        id="koi-pond-canvas"
        width={width}
        height={height}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          imageRendering: 'pixelated',
          display: 'block',
        }}
        onClick={(e) => handleTap(e.clientX, e.clientY)}
      />
    );
  }

  return (
    <Canvas
      type="2d"
      id="koi-pond-canvas"
      canvasId="koi-pond-canvas"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      onTouchStart={(e) => {
        const touch = e.touches?.[0];
        if (touch) handleTap(touch.clientX, touch.clientY);
      }}
      onReady={() => {
        Taro.createSelectorQuery()
          .select('#koi-pond-canvas')
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

export { KoiPondCanvas };
