'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface WeatherData {
  city: string;
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  is_outdoor_friendly: boolean;
  condition: string;
}

const CONDITION_BG: Record<string, string> = {
  clear: 'from-sky-400 to-blue-500',
  cloudy: 'from-gray-400 to-slate-500',
  rain: 'from-blue-600 to-indigo-700',
  snow: 'from-blue-200 to-slate-300',
  storm: 'from-gray-700 to-gray-900',
  other: 'from-sky-400 to-blue-500',
};

export default function WeatherWidget({ onWeatherLoad }: { onWeatherLoad?: (w: WeatherData) => void }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mcp/weather')
      .then(res => {
        setWeather(res.data);
        onWeatherLoad?.(res.data);
      })
      .catch(() => {/* non-fatal */})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 p-4 text-white animate-pulse h-24" />;
  }

  if (!weather) return null;

  const noKey = weather.description.includes('OPENWEATHER_API_KEY');
  const bg = CONDITION_BG[weather.condition] || CONDITION_BG.other;

  if (noKey) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 p-4 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌤️</span>
          <div>
            <div className="font-semibold text-sm">Live weather unavailable</div>
            <div className="text-xs opacity-80">
              Add <code className="bg-white/20 px-1 rounded">OPENWEATHER_API_KEY</code> to backend{' '}
              <code className="bg-white/20 px-1 rounded">.env</code> — free at{' '}
              <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="underline">openweathermap.org</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-gradient-to-r ${bg} p-4 text-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
              alt={weather.description}
              className="w-10 h-10"
            />
            <div>
              <div className="text-2xl font-bold">{weather.temp}°F</div>
              <div className="text-sm opacity-90 capitalize">{weather.description}</div>
            </div>
          </div>
          <div className="text-xs opacity-80 mt-1">📍 {weather.city} · Feels like {weather.feels_like}°F</div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold px-3 py-1 rounded-full ${weather.is_outdoor_friendly ? 'bg-green-400/30' : 'bg-red-400/30'}`}>
            {weather.is_outdoor_friendly ? '☀️ Good for outdoors' : '🌧️ Stay indoors'}
          </div>
          <div className="text-xs opacity-80 mt-2">
            💧 {weather.humidity}% · 💨 {weather.wind_speed} mph
          </div>
        </div>
      </div>
    </div>
  );
}
