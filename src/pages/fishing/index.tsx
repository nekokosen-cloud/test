import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import PixelCanvas from '@/components/PixelCanvas';
import { PixelButton, PixelPanel, PixelTag, RarityStars } from '@/components/PixelUI';
import { FishingFSM } from '@/game/fsm/fishingFSM';
import { usePlayerStore } from '@/stores/playerStore';
import { vibrateBite, vibrateReel } from '@/systems/vibration';
import { getRarityStars, getRarityLabel } from '@/systems/dropTable';
import { getWeatherIcon } from '@/systems/weather';
import type { Environment, EnvironmentId, Fish, FishingState, WeatherId } from '@/types';
import environmentsData from '@/data/environments.json';
import weatherData from '@/data/weather.json';
import './index.scss';

const environments = environmentsData as Environment[];
const weathers = weatherData as import('@/types').Weather[];
const GAME_WIDTH = 375;
const GAME_HEIGHT = 500;
const IS_DEV = process.env.NODE_ENV === 'development';

export default function FishingPage() {
  const {
    environmentId,
    weatherId,
    setEnvironment,
    setWeather,
    recordCatch,
    save,
  } = usePlayerStore();

  const [fishingState, setFishingState] = useState<FishingState>('idle');
  const [caughtFish, setCaughtFish] = useState<Fish | null>(null);
  const [isNewDiscovery, setIsNewDiscovery] = useState(false);
  const [screenFlash, setScreenFlash] = useState(0);
  const [statusText, setStatusText] = useState('点击「抛竿」开始钓鱼吧！');
  const fsmRef = useRef<FishingFSM | null>(null);

  const environment = environments.find((e) => e.id === environmentId)!;
  const weather = weathers.find((w) => w.id === weatherId)!;

  const initFSM = useCallback(() => {
    fsmRef.current?.destroy();
    fsmRef.current = new FishingFSM(
      { environmentId, weatherId, timeOfDay: 'day' },
      {
        onStateChange: (state) => {
          setFishingState(state);
          updateStatusText(state);
        },
        onBite: () => {
          if (save.settings.vibration) vibrateBite();
          setScreenFlash(0.4);
          setTimeout(() => setScreenFlash(0), 150);
        },
        onFishCaught: (fish) => {
          const isNew = recordCatch(fish);
          setCaughtFish(fish);
          setIsNewDiscovery(isNew);
          if (save.settings.vibration) vibrateReel();
        },
        onFishEscaped: () => {
          setStatusText('鱼跑了！再试一次吧。');
        },
      },
    );
  }, [environmentId, weatherId, save.settings.vibration, recordCatch]);

  useEffect(() => {
    initFSM();
    return () => fsmRef.current?.destroy();
  }, [initFSM]);

  useEffect(() => {
    fsmRef.current?.updateContext({ environmentId, weatherId, timeOfDay: 'day' });
  }, [environmentId, weatherId]);

  function updateStatusText(state: FishingState) {
    const texts: Record<FishingState, string> = {
      idle: '点击「抛竿」开始钓鱼吧！',
      casting: '抛竿中...',
      waiting: '等待鱼儿上钩...',
      biting: '咬钩了！快点击收杆！',
      reeling: '收杆中...',
      caught: '恭喜钓到了！',
      escaped: '鱼跑了！再试一次吧。',
    };
    setStatusText(texts[state]);
  }

  function handleCast() {
    fsmRef.current?.cast();
  }

  function handleCanvasTap() {
    if (fishingState === 'biting') {
      if (save.settings.vibration) vibrateReel();
      fsmRef.current?.reel();
    } else if (fishingState === 'caught' || fishingState === 'escaped') {
      fsmRef.current?.dismissCatch();
      setCaughtFish(null);
      setIsNewDiscovery(false);
    }
  }

  function handleDismissCatch() {
    fsmRef.current?.dismissCatch();
    setCaughtFish(null);
    setIsNewDiscovery(false);
  }

  function goToEncyclopedia() {
    Taro.navigateTo({ url: '/pages/encyclopedia/index' });
  }

  function cycleWeather() {
    const ids: WeatherId[] = ['sunny', 'cloudy', 'rainy', 'foggy'];
    const idx = ids.indexOf(weatherId);
    setWeather(ids[(idx + 1) % ids.length]);
  }

  function cycleEnvironment() {
    const ids: EnvironmentId[] = ['lake', 'river', 'ocean', 'pond'];
    const idx = ids.indexOf(environmentId);
    setEnvironment(ids[(idx + 1) % ids.length]);
  }

  const canCast = fishingState === 'idle';
  const showCatchModal = fishingState === 'caught' && caughtFish;

  return (
    <View className="fishing-page">
      <View className="fishing-page__header">
        <View className="fishing-page__env-info">
          <Text className="fishing-page__env-name">{environment.name}</Text>
          <Text className="fishing-page__weather">
            {getWeatherIcon(weatherId)} {weather.name}
          </Text>
        </View>
        <View className="fishing-page__header-actions">
          <PixelButton label="图鉴" onClick={goToEncyclopedia} variant="secondary" small />
        </View>
      </View>

      <View className="fishing-page__canvas-wrap">
        <PixelCanvas
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          environment={environment}
          weather={weather}
          fishingState={fishingState}
          caughtFish={caughtFish}
          onCanvasTap={handleCanvasTap}
          screenFlash={screenFlash}
        />
      </View>

      <View className="fishing-page__status">
        <Text className={`fishing-page__status-text ${fishingState === 'biting' ? 'fishing-page__status-text--urgent' : ''}`}>
          {statusText}
        </Text>
      </View>

      <View className="fishing-page__controls">
        <PixelButton
          label={fishingState === 'casting' ? '抛竿中...' : fishingState === 'waiting' ? '等待中...' : '抛竿'}
          onClick={handleCast}
          disabled={!canCast}
        />
      </View>

      <View className="fishing-page__selectors">
        <View className="fishing-page__selector" onClick={cycleEnvironment}>
          <Text className="fishing-page__selector-label">环境</Text>
          <Text className="fishing-page__selector-value">{environment.name}</Text>
        </View>
        <View className="fishing-page__selector" onClick={cycleWeather}>
          <Text className="fishing-page__selector-label">天气</Text>
          <Text className="fishing-page__selector-value">{getWeatherIcon(weatherId)} {weather.name}</Text>
        </View>
      </View>

      {IS_DEV && (
        <View className="fishing-page__debug">
          <Text className="fishing-page__debug-title">调试面板</Text>
          <View className="fishing-page__debug-actions">
            <PixelButton
              label="强制咬钩"
              onClick={() => fsmRef.current?.forceBite()}
              variant="danger"
              small
            />
          </View>
        </View>
      )}

      {showCatchModal && (
        <View className="catch-modal" onClick={handleDismissCatch}>
          <View className="catch-modal__content" onClick={(e) => e.stopPropagation()}>
            <PixelPanel title={isNewDiscovery ? '✨ 新发现！' : '钓到了！'}>
              <View className="catch-modal__fish">
                <View
                  className="catch-modal__fish-icon"
                  style={{ backgroundColor: caughtFish.color }}
                />
                <Text className="catch-modal__fish-name">{caughtFish.name}</Text>
                <RarityStars count={getRarityStars(caughtFish.rarity)} />
                <Text className="catch-modal__fish-rarity">{getRarityLabel(caughtFish.rarity)}</Text>
                <Text className="catch-modal__fish-desc">{caughtFish.description}</Text>
                <View className="catch-modal__tags">
                  {caughtFish.environments.map((e) => (
                    <PixelTag key={e} label={environments.find((env) => env.id === e)?.name ?? e} color="#5FA088" />
                  ))}
                  {caughtFish.weather.map((w) => (
                    <PixelTag key={w} label={weathers.find((wt) => wt.id === w)?.name ?? w} color="#6BB5E0" />
                  ))}
                </View>
              </View>
              <View className="catch-modal__actions">
                <PixelButton label="继续钓鱼" onClick={handleDismissCatch} />
              </View>
            </PixelPanel>
          </View>
        </View>
      )}
    </View>
  );
}
