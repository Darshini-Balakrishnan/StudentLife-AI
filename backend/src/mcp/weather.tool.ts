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
    // Use wttr.in as a free no-key fallback
    const res = await axios.get('https://wttr.in/Fairfax,VA?format=j1', { timeout: 8000 });
    // wttr.in wraps the payload in a top-level "data" key
    const d = res.data?.data ?? res.data;
    const current = d.current_condition?.[0];
    if (!current) throw new Error('wttr.in returned no current_condition');

    const tempF = parseInt(current.temp_F);
    const feelsLikeF = parseInt(current.FeelsLikeF ?? current.temp_F);
    const humidity = parseInt(current.humidity);
    const windMph = parseInt(current.windspeedMiles);
    const weatherCode = parseInt(current.weatherCode);

    // wttr.in codes: 113=sunny, 116=partly cloudy, 119/122=cloudy,
    // 176-282=rain/drizzle, 293-377=rain/sleet, 386-395=thunder/snow
    const condition: WeatherData['condition'] =
      weatherCode === 113 || weatherCode === 116 ? 'clear' :
      weatherCode <= 122 ? 'cloudy' :
      weatherCode >= 386 ? 'storm' :
      weatherCode >= 320 && weatherCode < 386 ? 'snow' :
      weatherCode >= 176 ? 'rain' : 'other';

    // Map wttr.in code to a description string
    const descMap: Record<number, string> = {
      113: 'sunny', 116: 'partly cloudy', 119: 'cloudy', 122: 'overcast',
      176: 'patchy rain', 200: 'thundery outbreaks', 227: 'blowing snow',
      230: 'blizzard', 248: 'fog', 260: 'freezing fog',
      263: 'light drizzle', 266: 'light drizzle', 281: 'freezing drizzle',
      284: 'heavy freezing drizzle', 293: 'light rain', 296: 'light rain',
      299: 'moderate rain', 302: 'moderate rain', 305: 'heavy rain',
      308: 'heavy rain', 311: 'light freezing rain', 314: 'moderate freezing rain',
      317: 'light sleet', 320: 'moderate sleet', 323: 'light snow',
      326: 'light snow', 329: 'moderate snow', 332: 'moderate snow',
      335: 'heavy snow', 338: 'heavy snow', 350: 'ice pellets',
      353: 'light rain shower', 356: 'moderate rain shower', 359: 'torrential rain',
      362: 'light sleet shower', 365: 'moderate sleet shower', 368: 'light snow shower',
      371: 'moderate snow shower', 374: 'light ice pellet shower',
      377: 'moderate ice pellet shower', 386: 'thundery rain', 389: 'heavy thundery rain',
      392: 'thundery snow', 395: 'heavy thundery snow',
    };
    const desc = descMap[weatherCode] ?? 'partly cloudy';

    const isOutdoorFriendly = !['rain', 'snow', 'storm'].includes(condition);
    const iconMap: Record<WeatherData['condition'], string> = {
      clear: '01d', cloudy: '03d', rain: '10d', snow: '13d', storm: '11d', other: '02d',
    };

    return {
      city: 'Fairfax, VA',
      temp: tempF,
      feels_like: feelsLikeF,
      description: desc,
      icon: iconMap[condition],
      humidity,
      wind_speed: windMph,
      is_outdoor_friendly: isOutdoorFriendly,
      condition,
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
