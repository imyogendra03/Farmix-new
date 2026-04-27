import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, Eye, Gauge, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import { toast } from 'react-toastify';
import SkeletonLoader from '../components/SkeletonLoader';

const WeatherMonitor = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetLat, setTargetLat] = useState('28.6139');
  const [targetLng, setTargetLng] = useState('77.2090');
  const [lastUpdated, setLastUpdated] = useState(null);

  const getWeatherIcon = (condition) => {
    if (!condition) return Cloud;
    const c = condition.toLowerCase();
    if (c.includes('clear') || c.includes('sunny')) return Sun;
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return CloudRain;
    if (c.includes('snow') || c.includes('sleet')) return CloudSnow;
    if (c.includes('cloud') || c.includes('overcast')) return Cloud;
    if (c.includes('wind')) return Wind;
    return Cloud;
  };

  const fetchWeatherData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/weather/data?lat=${targetLat}&lng=${targetLng}`);
      if (res.data.success) {
        setWeather(res.data.data);
        setLastUpdated(new Date());
        toast.success('Weather data updated successfully');
      }
    } catch (err) {
      toast.error('Failed to load weather data. Using mock data.');
      // Set mock data on failure
      setWeather({
        temp: 28,
        feelsLike: 31,
        tempMin: 25,
        tempMax: 32,
        humidity: 65,
        pressure: 1013,
        windSpeed: 12,
        windGust: 18,
        visibility: 10,
        uvIndex: 7,
        cloudCover: 40,
        rainProbability: 30,
        rainfall: 0,
        condition: 'Partly Cloudy',
        description: 'partly cloudy skies',
        location: 'Farm Location',
        coordinates: { lat: targetLat, lng: targetLng },
        status: 'mock'
      });
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getHealthStatus = () => {
    if (weather.rainProbability > 70) return { status: 'Alert', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' };
    if (weather.temp > 35 || weather.temp < 10) return { status: 'Caution', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20' };
    if (weather.humidity > 80) return { status: 'High Humidity', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' };
    return { status: 'Favorable', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' };
  };

  const healthStatus = weather ? getHealthStatus() : null;
  const WeatherIcon = weather ? getWeatherIcon(weather.condition) : Cloud;

  return (
    <PageTransition>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                <Cloud className="w-8 h-8 text-blue-600" /> Weather Monitor
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Real-time weather data, forecasts, and agricultural advisories for your farm
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto flex-wrap">
              <input 
                 type="text" 
                 value={targetLat} 
                 onChange={(e) => setTargetLat(e.target.value)} 
                 placeholder="Lat" 
                 className="input-field w-24 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
              <input 
                 type="text" 
                 value={targetLng} 
                 onChange={(e) => setTargetLng(e.target.value)} 
                 placeholder="Lng" 
                 className="input-field w-24 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button 
                 onClick={fetchWeatherData}
                 disabled={loading}
                 className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
             <SkeletonLoader type="card" count={3} />
          ) : weather ? (
            <>
              {/* Health Alert Banner */}
              {weather.status !== 'success' && (
                <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Mock Data</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">Using sample data. Add OPENWEATHER_API_KEY to .env for real-time data.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Weather Display */}
                <div className="lg:col-span-2 card overflow-hidden p-0 border border-gray-200 dark:border-gray-700 relative">
                  <div className={`${healthStatus.bgColor} p-8 border-b border-gray-200 dark:border-gray-700`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <WeatherIcon className="w-16 h-16 text-blue-500" />
                          <div>
                            <p className="text-5xl font-extrabold text-gray-900 dark:text-white">{weather.temp}°C</p>
                            <p className="text-lg text-gray-600 dark:text-gray-400">Feels like {weather.feelsLike}°C</p>
                          </div>
                        </div>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white capitalize mt-4">{weather.condition}</p>
                        <p className="text-gray-600 dark:text-gray-400 capitalize">{weather.description}</p>
                      </div>
                      <div className={`text-right ${healthStatus.color}`}>
                        <p className="text-sm font-semibold uppercase tracking-wide">{healthStatus.status}</p>
                        <div className="w-16 h-16 mx-auto mt-2 rounded-full border-4 flex items-center justify-center" style={{borderColor: 'currentColor'}}>
                          <span className="text-2xl font-bold">{weather.rainProbability}%</span>
                        </div>
                        <p className="text-xs mt-2">Rain Chance</p>
                      </div>
                    </div>
                  </div>

                  {/* Temp Range */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <Thermometer className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">Min</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{weather.tempMin}°C</p>
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="w-full bg-gradient-to-r from-blue-500 to-red-500 h-3 rounded-full"></div>
                      </div>
                      <div className="text-center">
                        <Thermometer className="w-5 h-5 text-red-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">Max</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{weather.tempMax}°C</p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Last Updated */}
                  <div className="p-6 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{weather.location}</span>
                    </div>
                    <span>Updated {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}</span>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="space-y-6">
                  
                  {/* Humidity */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Humidity</h3>
                      <Droplets className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">{weather.humidity}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${weather.humidity}%` }}></div>
                    </div>
                  </div>

                  {/* Wind Speed */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Wind</h3>
                      <Wind className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">{weather.windSpeed} m/s</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Gust: {weather.windGust} m/s</p>
                  </div>

                  {/* Visibility */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Visibility</h3>
                      <Eye className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{weather.visibility} km</div>
                  </div>

                  {/* UV Index */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">UV Index</h3>
                      <Sun className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">{weather.uvIndex}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {weather.uvIndex >= 8 ? 'Very High - Avoid outdoors' : weather.uvIndex >= 6 ? 'High - Use protection' : 'Moderate - Safe'}
                    </div>
                  </div>

                  {/* Pressure */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Pressure</h3>
                      <Gauge className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-green-600 dark:text-green-400">{weather.pressure} mb</div>
                  </div>

                  {/* Cloud Cover */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Cloud Cover</h3>
                      <Cloud className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-gray-600 dark:text-gray-400">{weather.cloudCover}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                      <div className="bg-gray-500 h-2.5 rounded-full" style={{ width: `${weather.cloudCover}%` }}></div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Agricultural Advisories */}
              <div className="mt-8 card p-6">
                <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm mb-4">Agricultural Advisories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {weather.humidity > 80 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="font-semibold text-blue-900 dark:text-blue-200 text-sm">High Humidity Alert</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Risk of fungal diseases. Monitor crops closely.</p>
                    </div>
                  )}
                  {weather.temp > 35 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="font-semibold text-red-900 dark:text-red-200 text-sm">Heat Stress Warning</p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">Increase irrigation frequency. Avoid spraying.</p>
                    </div>
                  )}
                  {weather.rainProbability > 70 && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <p className="font-semibold text-orange-900 dark:text-orange-200 text-sm">Heavy Rain Expected</p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Avoid pesticide application. Check drainage systems.</p>
                    </div>
                  )}
                  {weather.windSpeed > 15 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="font-semibold text-yellow-900 dark:text-yellow-200 text-sm">Strong Winds</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Risk to young plants. Secure stakes and support.</p>
                    </div>
                  )}
                  {weather.temp < 10 && (
                    <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                      <p className="font-semibold text-cyan-900 dark:text-cyan-200 text-sm">Cold Temperature</p>
                      <p className="text-xs text-cyan-700 dark:text-cyan-300 mt-1">Protect sensitive crops. Monitor for frost.</p>
                    </div>
                  )}
                  {weather.uvIndex > 6 && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <p className="font-semibold text-purple-900 dark:text-purple-200 text-sm">High UV Index</p>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Worker protection needed. Apply protective measures.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}

        </div>
      </div>
    </PageTransition>
  );
};

export default WeatherMonitor;
