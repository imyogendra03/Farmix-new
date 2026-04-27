import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, MapPin, RefreshCw } from 'lucide-react';

const OWM_API_KEY = process.env.REACT_APP_OWM_API_KEY || '';
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const WEATHER_CACHE_KEY = 'farmix_weather_cache';

const getWeatherIcon = (condition) => {
  if (!condition) return Cloud;
  const c = condition.toLowerCase();
  if (c.includes('clear') || c.includes('sun')) return Sun;
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return CloudRain;
  if (c.includes('snow') || c.includes('sleet')) return CloudSnow;
  if (c.includes('wind')) return Wind;
  return Cloud;
};

const readWeatherCache = () => {
  try {
    const cached = localStorage.getItem(WEATHER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const WeatherWidget = ({ onWeatherDataReturn }) => {
  const [cachedWeather] = useState(() => readWeatherCache());
  const [weather, setWeather] = useState(cachedWeather?.weather || null);
  const [loading, setLoading] = useState(!cachedWeather?.weather);
  const [lastUpdated, setLastUpdated] = useState(
    cachedWeather?.updatedAt ? new Date(cachedWeather.updatedAt) : null
  );

  const persistWeather = useCallback((data) => {
    try {
      const payload = {
        weather: data,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore cache write failures.
    }
  }, []);

  const fetchWithGeolocation = useCallback(() => {
    setLoading((prev) => prev || !cachedWeather?.weather);

    const applyMockData = (location = 'Farm Region') => {
      const mockData = {
        temp: 28,
        feelsLike: 31,
        humidity: 65,
        rainfall: 2, // mm/h
        rainProbability: 30,
        windSpeed: 12,
        condition: 'Partly Cloudy',
        location,
        description: 'partly cloudy skies'
      };
      setWeather(mockData);
      setLoading(false);
      const now = new Date();
      setLastUpdated(now);
      persistWeather(mockData);
      if (onWeatherDataReturn) onWeatherDataReturn(mockData);
    };

    const fetchFromOWM = async (lat, lon, locationName) => {
      try {
        // Current weather
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_API_KEY}`
        );
        // Forecast for rain probability
        const forecastRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=4&appid=${OWM_API_KEY}`
        );

        if (!weatherRes.ok) throw new Error('OWM API error');

        const weatherData = await weatherRes.json();
        let rainProbability = 0;
        if (forecastRes.ok) {
          const forecastData = await forecastRes.json();
          rainProbability = Math.round((forecastData.list?.[0]?.pop || 0) * 100);
        }

        const data = {
          temp: Math.round(weatherData.main.temp),
          feelsLike: Math.round(weatherData.main.feels_like),
          humidity: weatherData.main.humidity,
          rainfall: weatherData.rain?.['1h'] || 0,
          rainProbability,
          windSpeed: Math.round(weatherData.wind.speed * 3.6), // m/s to km/h
          condition: weatherData.weather[0].main,
          description: weatherData.weather[0].description,
          location: locationName || weatherData.name || 'Your Location'
        };

        setWeather(data);
        const now = new Date();
        setLastUpdated(now);
        persistWeather(data);
        if (onWeatherDataReturn) onWeatherDataReturn(data);
      } catch (err) {
        // Fall back to mock data
        applyMockData(locationName || 'Farm Region');
      } finally {
        setLoading(false);
      }
    };

    if (OWM_API_KEY && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchFromOWM(latitude, longitude);
        },
        () => {
          // Geolocation denied — use fallback
          applyMockData();
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      // No API key or geolocation — use mock data
      applyMockData();
    }
  }, [cachedWeather, onWeatherDataReturn, persistWeather]);

  useEffect(() => {
    if (cachedWeather?.weather && onWeatherDataReturn) {
      onWeatherDataReturn(cachedWeather.weather);
    }
    fetchWithGeolocation();
    const interval = setInterval(fetchWithGeolocation, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [cachedWeather, fetchWithGeolocation, onWeatherDataReturn]);

  if (loading) {
    return (
      <div className="card p-4 bg-blue-50 dark:bg-gray-800 border-blue-100 dark:border-gray-700">
        <div className="shimmer h-4 rounded w-1/2 mb-3"></div>
        <div className="shimmer h-10 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-100 dark:border-gray-700">
          <div className="shimmer h-4 rounded w-3/4"></div>
          <div className="shimmer h-4 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const WeatherIcon = getWeatherIcon(weather.condition);

  return (
    <div className="card p-5 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-800 dark:to-gray-900 border-blue-100 dark:border-gray-700">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 uppercase tracking-wider">
            <MapPin className="w-3 h-3" /> {weather.location}
          </h3>
          <div className="mt-2 flex items-center gap-3">
            <WeatherIcon className="w-10 h-10 text-blue-400" />
            <div>
              <span className="text-3xl font-bold text-gray-800 dark:text-white">{weather.temp}°C</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{weather.description}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Feels like {weather.feelsLike}°C</p>
        </div>
        <button
          onClick={fetchWithGeolocation}
          title="Refresh weather"
          disabled={loading}
          className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-100 dark:hover:bg-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-100 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Droplets className="w-4 h-4 text-cyan-500 flex-shrink-0" />
          <span>Humidity: <span className="font-semibold text-gray-800 dark:text-white">{weather.humidity}%</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <CloudRain className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span>Rain Prob: <span className="font-semibold text-gray-800 dark:text-white">{weather.rainProbability}%</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Wind className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>Wind: <span className="font-semibold text-gray-800 dark:text-white">{weather.windSpeed} km/h</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Thermometer className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span>Rainfall: <span className="font-semibold text-gray-800 dark:text-white">{weather.rainfall} mm/h</span></span>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-3 text-right">
          Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
};

export default React.memo(WeatherWidget);
