import { View, Text } from '@tarojs/components';
import './index.scss';

interface PixelButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  small?: boolean;
}

export function PixelButton({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  small = false,
}: PixelButtonProps) {
  return (
    <View
      className={`pixel-btn pixel-btn--${variant} ${small ? 'pixel-btn--small' : ''} ${disabled ? 'pixel-btn--disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <Text className="pixel-btn__text">{label}</Text>
    </View>
  );
}

interface PixelPanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function PixelPanel({ children, title, className = '' }: PixelPanelProps) {
  return (
    <View className={`pixel-panel ${className}`}>
      {title && <Text className="pixel-panel__title">{title}</Text>}
      {children}
    </View>
  );
}

interface PixelTagProps {
  label: string;
  color?: string;
}

export function PixelTag({ label, color = '#E8A838' }: PixelTagProps) {
  return (
    <View className="pixel-tag" style={{ borderColor: color }}>
      <Text className="pixel-tag__text" style={{ color }}>{label}</Text>
    </View>
  );
}

interface RarityStarsProps {
  count: number;
}

export function RarityStars({ count }: RarityStarsProps) {
  return (
    <View className="rarity-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <Text key={i} className={`rarity-stars__star ${i < count ? 'rarity-stars__star--active' : ''}`}>
          ★
        </Text>
      ))}
    </View>
  );
}
