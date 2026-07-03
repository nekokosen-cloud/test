import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

export type GameTabId = 'fishing' | 'koi' | 'encyclopedia';

const TABS: { id: GameTabId; label: string; path: string }[] = [
  { id: 'fishing', label: '钓鱼', path: '/pages/fishing/index' },
  { id: 'koi', label: '锦鲤', path: '/pages/koi/index' },
  { id: 'encyclopedia', label: '图鉴', path: '/pages/encyclopedia/index' },
];

interface GameTabBarProps {
  active: GameTabId;
}

export function GameTabBar({ active }: GameTabBarProps) {
  function switchTab(path: string) {
    Taro.reLaunch({ url: path });
  }

  return (
    <View className="game-tab-bar">
      {TABS.map((tab) => (
        <View
          key={tab.id}
          className={`game-tab-bar__item ${active === tab.id ? 'game-tab-bar__item--active' : ''}`}
          onClick={() => {
            if (active !== tab.id) switchTab(tab.path);
          }}
        >
          <Text className="game-tab-bar__label">{tab.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default GameTabBar;
