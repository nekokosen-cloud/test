import { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { PixelButton, PixelPanel, PixelTag, RarityStars } from '@/components/PixelUI';
import { usePlayerStore } from '@/stores/playerStore';
import { getAllFish, getRarityLabel, getRarityStars } from '@/systems/dropTable';
import { getWeatherIcon } from '@/systems/weather';
import type { Fish } from '@/types';
import environmentsData from '@/data/environments.json';
import weatherData from '@/data/weather.json';
import './index.scss';

const allFish = getAllFish();
const environments = environmentsData as import('@/types').Environment[];
const weathers = weatherData as import('@/types').Weather[];

export default function EncyclopediaPage() {
  const { isDiscovered, getCaughtCount, getDiscoveredCount, save } = usePlayerStore();
  const [selectedFish, setSelectedFish] = useState<Fish | null>(null);

  const discoveredCount = getDiscoveredCount();
  const totalCount = allFish.length;

  function goBack() {
    Taro.navigateBack();
  }

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
        <View className="encyclopedia-page__back" onClick={goBack}>
          <Text className="encyclopedia-page__back-text">← 返回</Text>
        </View>
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

      <View className="encyclopedia-page__grid">
        {allFish.map((fish) => {
          const discovered = isDiscovered(fish.id);
          const count = getCaughtCount(fish.id);
          return (
            <View
              key={fish.id}
              className={`encyclopedia-page__cell ${discovered ? '' : 'encyclopedia-page__cell--locked'}`}
              onClick={() => discovered && setSelectedFish(fish)}
            >
              <View
                className="encyclopedia-page__fish-sprite"
                style={{
                  backgroundColor: discovered ? fish.color : '#444',
                  opacity: discovered ? 1 : 0.4,
                }}
              >
                {!discovered && (
                  <Text className="encyclopedia-page__fish-unknown">?</Text>
                )}
              </View>
              <Text className="encyclopedia-page__fish-name">
                {discovered ? fish.name : '???'}
              </Text>
              {discovered && count > 0 && (
                <Text className="encyclopedia-page__fish-count">×{count}</Text>
              )}
            </View>
          );
        })}
      </View>

      {selectedFish && (
        <View className="fish-detail" onClick={() => setSelectedFish(null)}>
          <View className="fish-detail__content" onClick={(e) => e.stopPropagation()}>
            <PixelPanel title={selectedFish.name}>
              <View className="fish-detail__body">
                <View
                  className="fish-detail__sprite"
                  style={{ backgroundColor: selectedFish.color }}
                />
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
    </View>
  );
}
