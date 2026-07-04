import type { Weather, WeatherId } from '@/types';
import { loadJsonArray } from '@/minigame/utils/loadJson';
import * as weatherModule from '@/data/weather.json';

const weathers = loadJsonArray<Weather>(weatherModule);

export function getAllWeather(): Weather[] {
  return weathers;
}

export function getWeatherById(id: WeatherId): Weather | undefined {
  return weathers.find((w) => w.id === id);
}

export function getNextWeather(currentId: WeatherId): WeatherId {
  const ids: WeatherId[] = ['sunny', 'cloudy', 'rainy', 'foggy'];
  const idx = ids.indexOf(currentId);
  return ids[(idx + 1) % ids.length];
}

export function getWeatherIcon(id: WeatherId): string {
  const icons: Record<WeatherId, string> = {
    sunny: '☀',
    cloudy: '☁',
    rainy: '🌧',
    foggy: '🌫',
  };
  return icons[id];
}
