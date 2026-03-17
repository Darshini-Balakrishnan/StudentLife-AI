import axios from 'axios';

export interface WeatherData {
  city: string;
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  is_outdoor_friendly: boolean;
  condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'other';
}

const OUTDOOR_UNFRIENDLY = ['rain', 'snow', 'storm'];

function classifyCondition(weatherId: number): WeatherData['condition'] {
  if (weatherId >= 200 && weatherId < 300) return 'storm';
  if (weatherId >= 300 && weatherId < 600) return 'rain';
  if (weatherId >= 600 && weatherId < 700) return 'snow';
  if (weatherId >= 800 && weatherId < 802) return 'clear';
  if (weatherId >= 802) return 'cloudy';
  return 'other';
}

export async function getWeather(city = 'Fairfax,VA,US'): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    // Try wttr.in as a free no-key fallback
    try {
      const res = await axios.get('https://wttr.in/Fairfax,VA?format=j1', { timeout: 5000 });
      const d = res.data;
      const current = d.current_condition?.[0];
      if (current) {
        const tempF = parseInt(current.temp_F);
        const desc = current.weatherDesc?.[0]?.value || 'Unknown';
        const humidity = parseInt(current.humidity);
        const windMph = parseInt(current.windspeedMiles);
        const weatherCode = parseInt(current.weatherCode);
        // wttr.in weather codes: 200-299 thunder, 300-399 drizzle, 500-599 rain, 600-699 snow, 800 clear, 801-804 cloudy
        const condition: WeatherData['condition'] =
          weatherCode >= 200 && weatherCode < 300 ? 'storm' :
          weatherCode >= 300 && weatherCode < 600 ? 'rain' :
          weatherCode >= 600 && weatherCode < 700 ? 'snow' :
          weatherCode === 113 ? 'clear' :
          weatherCode <= 119 ? 'cloudy' : 'other';
        const isOutdoorFriendly = !['rain', 'snow', 'storm'].includes(condition);
        return {
          city: 'Fairfax, VA',
          temp: tempF,
          feels_like: parseInt(current.FeelsLikeF || current.temp_F),
          description: desc.toLowerCase(),
          icon: isOutdoorFriendly ? '01d' : condition === 'rain' ? '10d' : condition === 'snow' ? '13d' : '11d',
          humidity,
          wind_speed: windMph,
          is_outdoor_friendly: isOutdoorFriendly,
          condition,
        };
      }
    } catch {
      // wttr.in also failed — return static default
    }
    return {
      city: 'Fairfax, VA',
      temp: 72,
      feels_like: 70,
      description: 'Add OPENWEATHER_API_KEY to .env for live weather',
      icon: '01d',
      humidity: 50,
      wind_speed: 5,
      is_outdoor_friendly: true,
      condition: 'clear',
    };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=imperial`;
  const res = await axios.get(url, { timeout: 5000 });
  const d = res.data;

  const condition = classifyCondition(d.weather[0].id);

  return {
    city: d.name,
    temp: Math.round(d.main.temp),
    feels_like: Math.round(d.main.feels_like),
    description: d.weather[0].description,
    icon: d.weather[0].icon,
    humidity: d.main.humidity,
    wind_speed: Math.round(d.wind.speed),
    is_outdoor_friendly: !OUTDOOR_UNFRIENDLY.includes(condition),
    condition,
  };
}
