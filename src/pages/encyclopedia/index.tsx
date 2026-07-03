import { useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import FishSprite from '@/components/FishSprite';
import { PixelButton, PixelPanel, PixelTag, RarityStars } from '@/components/PixelUI';
import { usePlayerStore } from '@/stores/playerStore';
import { getAllFish, getRarityLabel, getRarityStars } from '@/systems/dropTable';
import { getRarityBorderColor } from '@/game/renderer/fishSprites';
import { getWeatherIcon } from '@/systems/weather';
import { GameTabBar } from '@/components/GameTabBar';
import type { Fish, FishRarity } from '@/types';
import environmentsData from '@/data/environments.json';
import weatherData from '@/data/weather.json';
import './index.scss';

const allFish = getAllFish();
const environments = environmentsData as import('@/types').Environment[];
const weathers = weatherData as import('@/types').Weather[];

const RARITY_ORDER: Record<FishRarity, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  uncommon: 3,
  common: 4,
};

type FilterMode = 'all' | 'caught' | 'uncaught';

export default function EncyclopediaPage() {
  const { isDiscovered, getCaughtCount, getDiscoveredCount, save } = usePlayerStore();
  const [selectedFish, setSelectedFish] = useState<Fish | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');

  const discoveredCount = getDiscoveredCount();
  const totalCount = allFish.length;

  const filteredFish = useMemo(() => {
    let list = [...allFish];
    if (filter === 'caught') list = list.filter((f) => isDiscovered(f.id));
    if (filter === 'uncaught') list = list.filter((f) => !isDiscovered(f.id));
    return list.sort((a, b) => {
      const rd = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
      return rd !== 0 ? rd : a.name.localeCompare(b.name, 'zh-CN');
    });
  }, [filter, save.caughtFish]);

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('zh-CN');
    } catch {
      return iso;
    }
  }

  return (
    <View className="encyclopedia-page">
      <View className="encyclopedia-page__header">
        <Text className="encyclopedia-page__title">鱼种图鉴</Text>
        <Text className="encyclopedia-page__progress">
          {discoveredCount}/{totalCount}
        </Text>
      </View>

      <View className="encyclopedia-page__progress-bar">
        <View
          className="encyclopedia-page__progress-fill"
          style={{ width: `${(discoveredCount / totalCount) * 100}%` }}
        />
      </View>

      <View className="encyclopedia-page__filters">
        {([
          ['all', '全部'],
          ['caught', '已收集'],
          ['uncaught', '未收集'],
        ] as [FilterMode, string][]).map(([key, label]) => (
          <View
            key={key}
            className={`encyclopedia-page__filter ${filter === key ? 'encyclopedia-page__filter--active' : ''}`}
            onClick={() => setFilter(key)}
          >
            <Text className="encyclopedia-page__filter-text">{label}</Text>
          </View>
        ))}
      </View>

      <View className="encyclopedia-page__grid">
        {filteredFish.map((fish) => {
          const discovered = isDiscovered(fish.id);
          const count = getCaughtCount(fish.id);
          const borderColor = getRarityBorderColor(fish.rarity);
          return (
            <View
              key={fish.id}
              className={`encyclopedia-page__cell ${discovered ? '' : 'encyclopedia-page__cell--locked'}`}
              style={{ borderColor: discovered ? borderColor : undefined }}
              onClick={() => discovered && setSelectedFish(fish)}
            >
              <View className="encyclopedia-page__sprite-wrap">
                {discovered ? (
                  <FishSprite fish={fish} size={56} />
                ) : (
                  <View className="encyclopedia-page__sprite-locked">
                    <FishSprite fish={fish} size={56} silhouette />
                    <Text className="encyclopedia-page__fish-unknown">?</Text>
                  </View>
                )}
              </View>
              <Text className="encyclopedia-page__fish-name">
                {discovered ? fish.name : '???'}
              </Text>
              {discovered && (
                <View className="encyclopedia-page__meta">
                  <RarityStars count={getRarityStars(fish.rarity)} />
                  {count > 0 && (
                    <Text className="encyclopedia-page__fish-count">×{count}</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {filteredFish.length === 0 && (
        <Text className="encyclopedia-page__empty">暂无符合条件的鱼种</Text>
      )}

      {selectedFish && (
        <View className="fish-detail" onClick={() => setSelectedFish(null)}>
          <View className="fish-detail__content" onClick={(e) => e.stopPropagation()}>
            <PixelPanel title={selectedFish.name}>
              <View className="fish-detail__body">
                <View
                  className="fish-detail__sprite-frame"
                  style={{ borderColor: getRarityBorderColor(selectedFish.rarity) }}
                >
                  <FishSprite fish={selectedFish} size={96} />
                </View>
                <RarityStars count={getRarityStars(selectedFish.rarity)} />
                <Text className="fish-detail__rarity">
                  {getRarityLabel(selectedFish.rarity)}
                </Text>
                <Text className="fish-detail__desc">{selectedFish.description}</Text>

                <View className="fish-detail__section">
                  <Text className="fish-detail__section-title">出没环境</Text>
                  <View className="fish-detail__tags">
                    {selectedFish.environments.map((e) => (
                      <PixelTag
                        key={e}
                        label={environments.find((env) => env.id === e)?.name ?? e}
                        color="#5FA088"
                      />
                    ))}
                  </View>
                </View>

                <View className="fish-detail__section">
                  <Text className="fish-detail__section-title">活跃天气</Text>
                  <View className="fish-detail__tags">
                    {selectedFish.weather.map((w) => (
                      <PixelTag
                        key={w}
                        label={`${getWeatherIcon(w)} ${weathers.find((wt) => wt.id === w)?.name ?? w}`}
                        color="#6BB5E0"
                      />
                    ))}
                  </View>
                </View>

                <View className="fish-detail__stats">
                  <Text className="fish-detail__stat">
                    钓获次数：{getCaughtCount(selectedFish.id)}
                  </Text>
                  {save.caughtFish[selectedFish.id] && (
                    <Text className="fish-detail__stat">
                      首次钓获：{formatDate(save.caughtFish[selectedFish.id].firstCaughtAt)}
                    </Text>
                  )}
                </View>
              </View>
              <View className="fish-detail__actions">
                <PixelButton label="关闭" onClick={() => setSelectedFish(null)} variant="secondary" />
              </View>
            </PixelPanel>
          </View>
        </View>
      )}

      <GameTabBar active="encyclopedia" />
    </View>
  );
}
