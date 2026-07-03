import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import KoiPondCanvas from '@/components/KoiPondCanvas';
import { PixelButton, PixelPanel, PixelTag } from '@/components/PixelUI';
import { useKoiStore } from '@/stores/koiStore';
import { usePlayerStore } from '@/stores/playerStore';
import { vibratePet } from '@/systems/vibration';
import {
  getStageName,
  getStatusMessage,
  WARN_FULLNESS,
} from '@/game/koi/koiSimulation';
import type { KoiSkin } from '@/types';
import './index.scss';

const GAME_WIDTH = 375;
const GAME_HEIGHT = 480;
const IS_DEV = process.env.NODE_ENV === 'development';

function StatBar({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: 'hunger' | 'fullness' | 'happiness' | 'health';
}) {
  return (
    <View className="koi-page__stat-row">
      <Text className="koi-page__stat-label">{label}</Text>
      <View className="koi-page__stat-bar">
        <View
          className={`koi-page__stat-fill koi-page__stat-fill--${variant}`}
          style={{ width: `${Math.round(value)}%` }}
        />
      </View>
      <Text className="koi-page__stat-value">{Math.round(value)}</Text>
    </View>
  );
}

export default function KoiPage() {
  const { isDiscovered, save: playerSave } = usePlayerStore();
  const {
    save,
    lastActionMessage,
    tick,
    adoptKoi,
    feed,
    pet,
    revive,
    devAdvanceHours,
    devForceKill,
    devForceStage,
  } = useKoiStore();

  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [showReviveModal, setShowReviveModal] = useState(false);
  const [nameInput, setNameInput] = useState('小金');
  const [feedTrigger, setFeedTrigger] = useState(0);
  const [petTrigger, setPetTrigger] = useState(0);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasGoldBonus = isDiscovered('gold_koi');
  const koi = save.koi;
  const skin: KoiSkin = hasGoldBonus ? 'gold' : 'common';

  useDidShow(() => {
    tick();
  });

  useEffect(() => {
    tick();
    tickTimerRef.current = setInterval(() => tick(), 30000);
    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, [tick]);

  useEffect(() => {
    if (!koi) {
      setShowAdoptModal(true);
    }
  }, [koi]);

  const statusMessage = useMemo(() => {
    if (lastActionMessage) return lastActionMessage;
    if (koi) return getStatusMessage(koi);
    return '欢迎来到锦鲤池塘！';
  }, [koi, lastActionMessage]);

  const isWarning = koi?.isAlive && (koi.fullness >= WARN_FULLNESS || koi.hunger >= 80);

  function goBack() {
    Taro.navigateBack();
  }

  function handleAdopt() {
    adoptKoi(nameInput, skin);
    setShowAdoptModal(false);
  }

  function handleFeed() {
    if (!koi?.isAlive) return;
    const result = feed();
    if (!result.died) setFeedTrigger((n) => n + 1);
  }

  function handlePet() {
    if (!koi?.isAlive) return;
    const result = pet();
    if (result.ok) {
      setPetTrigger((n) => n + 1);
      if (playerSave.settings.vibration) vibratePet();
    }
  }

  function handleCanvasPet() {
    handlePet();
  }

  function handleRevive() {
    revive(nameInput, skin);
    setShowReviveModal(false);
  }

  function openReviveModal() {
    setNameInput(koi?.name ?? '小金');
    setShowReviveModal(true);
  }

  return (
    <View className="koi-page">
      <View className="koi-page__header">
        <PixelButton label="返回" onClick={goBack} variant="secondary" small />
        <Text className="koi-page__title">锦鲤池塘</Text>
        <View className="koi-page__header-actions">
          {hasGoldBonus && <PixelTag label="金锦鲤加成" color="#E8A838" />}
        </View>
      </View>

      {koi ? (
        <>
          <View className="koi-page__canvas-wrap">
            <KoiPondCanvas
              width={GAME_WIDTH}
              height={GAME_HEIGHT}
              koi={koi}
              onPet={handleCanvasPet}
              feedTrigger={feedTrigger}
              petTrigger={petTrigger}
            />
          </View>

          <View className="koi-page__info">
            <View className="koi-page__name-row">
              <Text className="koi-page__name">{koi.name}</Text>
              <Text className="koi-page__stage">
                {getStageName(koi.growthStage)} · 阶段 {koi.growthStage}
              </Text>
            </View>
            <View className="koi-page__stats">
              <StatBar label="饥饿" value={koi.hunger} variant="hunger" />
              <StatBar label="饱食" value={koi.fullness} variant="fullness" />
              <StatBar label="心情" value={koi.happiness} variant="happiness" />
              <StatBar label="健康" value={koi.health} variant="health" />
            </View>
          </View>

          <View className="koi-page__status">
            <Text className={`koi-page__status-text ${isWarning ? 'koi-page__status-text--warn' : ''}`}>
              {statusMessage}
            </Text>
          </View>

          {koi.isAlive ? (
            <>
              <View className="koi-page__controls">
                <PixelButton
                  label="喂食"
                  onClick={handleFeed}
                  variant={koi.fullness >= WARN_FULLNESS ? 'danger' : 'primary'}
                />
                <PixelButton label="摸摸" onClick={handlePet} variant="secondary" />
              </View>
              <Text className="koi-page__hint">点击池塘里的锦鲤也可以互动哦~</Text>
            </>
          ) : (
            <View className="koi-page__controls">
              <PixelButton label="重新开始" onClick={openReviveModal} variant="primary" />
            </View>
          )}
        </>
      ) : (
        <View className="adopt-panel">
          <Text className="adopt-panel__emoji">🐟</Text>
          <Text className="adopt-panel__text">
            领养一条可爱的锦鲤，{'\n'}喂食、互动，看着它慢慢长大吧！
          </Text>
          <PixelButton label="领养锦鲤" onClick={() => setShowAdoptModal(true)} />
        </View>
      )}

      {IS_DEV && koi && (
        <View className="koi-page__debug">
          <Text className="koi-page__debug-title">调试面板</Text>
          <View className="koi-page__debug-actions">
            <PixelButton label="+1小时" onClick={() => devAdvanceHours(1)} variant="secondary" small />
            <PixelButton label="+12小时" onClick={() => devAdvanceHours(12)} variant="secondary" small />
            <PixelButton label="强制撑死" onClick={devForceKill} variant="danger" small />
            <PixelButton label="阶段4" onClick={() => devForceStage(4)} variant="secondary" small />
          </View>
        </View>
      )}

      {showAdoptModal && (
        <View className="koi-modal">
          <View className="koi-modal__content">
            <PixelPanel title="领养锦鲤">
              <Text className="koi-modal__desc">
                给你的锦鲤取个名字吧！记得合理喂食，喂太多会撑死的…
              </Text>
              {hasGoldBonus && (
                <Text className="koi-modal__bonus">
                  你已钓到金锦鲤！将获得金色皮肤和初始心情加成 ✨
                </Text>
              )}
              <View className="koi-modal__input-wrap">
                <Input
                  className="koi-modal__input"
                  value={nameInput}
                  onInput={(e) => setNameInput(e.detail.value)}
                  maxlength={8}
                  placeholder="输入名字"
                />
              </View>
              <View className="koi-modal__actions">
                <PixelButton label="开始养锦鲤" onClick={handleAdopt} />
                {koi && (
                  <PixelButton label="取消" onClick={() => setShowAdoptModal(false)} variant="secondary" />
                )}
              </View>
            </PixelPanel>
          </View>
        </View>
      )}

      {showReviveModal && (
        <View className="koi-modal">
          <View className="koi-modal__content">
            <PixelPanel title="重新开始">
              <Text className="koi-modal__desc">
                {koi?.deathMessage || '锦鲤离开了…'}
                {'\n'}要再养一条新的吗？
              </Text>
              <View className="koi-modal__input-wrap">
                <Input
                  className="koi-modal__input"
                  value={nameInput}
                  onInput={(e) => setNameInput(e.detail.value)}
                  maxlength={8}
                  placeholder="输入名字"
                />
              </View>
              <View className="koi-modal__actions">
                <PixelButton label="重新领养" onClick={handleRevive} />
                <PixelButton label="取消" onClick={() => setShowReviveModal(false)} variant="secondary" />
              </View>
            </PixelPanel>
          </View>
        </View>
      )}

      {koi && !koi.isAlive && !showReviveModal && (
        <View className="koi-modal">
          <View className="koi-modal__content">
            <PixelPanel title="锦鲤离开了…">
              <Text className="koi-modal__desc">{koi.deathMessage}</Text>
              <Text className="koi-modal__desc">
                {koi.deathReason === 'overfed'
                  ? '下次记得控制喂食量，锦鲤也需要节制饮食。'
                  : '下次记得按时喂食，别让锦鲤饿太久。'}
              </Text>
              <View className="koi-modal__actions">
                <PixelButton label="重新开始" onClick={openReviveModal} />
              </View>
            </PixelPanel>
          </View>
        </View>
      )}
    </View>
  );
}
