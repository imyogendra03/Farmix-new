import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, MapPin, BarChart3, Navigation, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import SkeletonLoader from '../components/SkeletonLoader';

// Default crops for comparison - moved outside component to avoid dependency issues
const DEFAULT_CROPS = ['wheat', 'rice', 'maize', 'sugarcane', 'cotton', 'soybean'];

// Common Indian states and their coordinates (for manual location selection)
const INDIAN_STATES = [
  { name: 'Uttar Pradesh (Lucknow)', lat: 26.8467, lng: 80.9462 },
  { name: 'Haryana (Karnal)', lat: 29.5941, lng: 77.0522 },
  { name: 'Madhya Pradesh (Indore)', lat: 22.7196, lng: 75.8577 },
  { name: 'Gujarat (Rajkot)', lat: 22.3039, lng: 71.8018 },
  { name: 'Punjab (Ludhiana)', lat: 30.9010, lng: 75.8573 },
  { name: 'Maharashtra (Pune)', lat: 18.5204, lng: 73.8567 },
  { name: 'Karnataka (Bengaluru)', lat: 12.9716, lng: 77.5946 },
  { name: 'Rajasthan (Jaipur)', lat: 26.9124, lng: 75.7873 },
  { name: 'Telangana (Hyderabad)', lat: 17.3850, lng: 78.4867 },
  { name: 'Andhra Pradesh (Vijayawada)', lat: 16.5062, lng: 80.6480 },
];

const MarketPrediction = () => {
  const [prices, setPrices] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [loading, setLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Location-based state
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Current Location');
  const [nearbyMandis, setNearbyMandis] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cropComparison, setCropComparison] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [activeTab, setActiveTab] = useState('nearby'); // 'nearby' or 'comparison'
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');

  // Fetch prices with location
  const fetchPricesWithLocation = useCallback(async (lat, lon) => {
    try {
      setLoading(true);
      const res = await api.get('/market/prices', {
        params: {
          latitude: lat,
          longitude: lon,
          crops: DEFAULT_CROPS.join(',')
        }
      });
      if (res.data.success) {
        // Handle both array format (mock) and object format (enamService)
        let priceData = res.data.data;
        if (priceData && typeof priceData === 'object' && !Array.isArray(priceData)) {
          // It's the enamService response object, extract prices from pricesByDistrict
          priceData = priceData.pricesByDistrict || [];
        }
        setPrices(Array.isArray(priceData) ? priceData : []);
      }
    } catch (err) {
      console.error('Failed to load market prices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch location-based prices and mandis
  const fetchLocationBasedData = useCallback(async (lat, lon) => {
    try {
      // Fetch nearby mandis with prices
      const mandiRes = await api.post('/market/nearby-mandis', {
        latitude: lat,
        longitude: lon,
        crop: selectedCrop.toLowerCase(),
        radiusKm: 100
      });

      if (mandiRes.data.success) {
        setNearbyMandis(mandiRes.data.data.nearbyMandis || []);
      }

      // Fetch crop comparison
      setComparisonLoading(true);
      const comparisonRes = await api.post('/market/crop-comparison', {
        latitude: lat,
        longitude: lon,
        crops: DEFAULT_CROPS
      });

      if (comparisonRes.data.success) {
        // Transform data for chart
        const chartData = Object.entries(comparisonRes.data.data.cropComparison).map(([crop, data]) => ({
          crop: crop.charAt(0).toUpperCase() + crop.slice(1),
          averagePrice: data.averagePrice,
          minPrice: data.minPrice,
          maxPrice: data.maxPrice,
          trend: data.trend
        }));
        setCropComparison(chartData);
      }
      setComparisonLoading(false);
    } catch (err) {
      console.error('Failed to fetch location-based data:', err);
      setComparisonLoading(false);
    }
  }, [selectedCrop]);

  // Get user location
  useEffect(() => {
    const getLocation = async () => {
      setLocationLoading(true);
      setLocationError(null);
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setLocation({ latitude, longitude });
              setLocationName('📍 Current Location');
              fetchPricesWithLocation(latitude, longitude);
              fetchLocationBasedData(latitude, longitude);
            },
            (error) => {
              console.error('Geolocation error:', error);
              setLocationError('Unable to get location. Using Lucknow.');
              // Use default location (Lucknow)
              const defaultLoc = { latitude: 26.8467, longitude: 80.9462 };
              setLocation(defaultLoc);
              setLocationName('Lucknow (Default)');
              fetchPricesWithLocation(defaultLoc.latitude, defaultLoc.longitude);
              fetchLocationBasedData(defaultLoc.latitude, defaultLoc.longitude);
            }
          );
        } else {
          setLocationError('Geolocation not supported. Using Lucknow.');
          // Use default location
          const defaultLoc = { latitude: 26.8467, longitude: 80.9462 };
          setLocation(defaultLoc);
          setLocationName('Lucknow (Default)');
          fetchPricesWithLocation(defaultLoc.latitude, defaultLoc.longitude);
          fetchLocationBasedData(defaultLoc.latitude, defaultLoc.longitude);
        }
      } catch (err) {
        console.error('Error getting location:', err);
        setLocationError('Error getting location');
      } finally {
        setLocationLoading(false);
      }
    };

    getLocation();
  }, [fetchLocationBasedData, fetchPricesWithLocation]);

  // Handle location change
  const handleLocationChange = (state) => {
    setLocation({ latitude: state.lat, longitude: state.lng });
    setLocationName(state.name);
    fetchPricesWithLocation(state.lat, state.lng);
    fetchLocationBasedData(state.lat, state.lng);
    setShowLocationModal(false);
  };

  // Handle custom location input
  const handleCustomLocation = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude');
      return;
    }

    setLocation({ latitude: lat, longitude: lng });
    setLocationName(`📍 Custom (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    fetchPricesWithLocation(lat, lng);
    fetchLocationBasedData(lat, lng);
    setCustomLat('');
    setCustomLng('');
    setShowLocationModal(false);
  };

  // Fetch forecast when crop changes
  useEffect(() => {
    const fetchForecast = async () => {
      setForecastLoading(true);
      try {
        const res = await api.get(`/market/predict?crop=${selectedCrop}`);
        if (res.data.success) {
          setForecast(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load forecast');
      } finally {
        setForecastLoading(false);
      }
    };
    if (selectedCrop) fetchForecast();
  }, [selectedCrop]);

  // Handle crop selection - update nearby mandis
  const handleCropChange = async (crop) => {
    setSelectedCrop(crop);
    if (location) {
      try {
        const res = await api.post('/market/nearby-mandis', {
          latitude: location.latitude,
          longitude: location.longitude,
          crop: crop.toLowerCase(),
          radiusKm: 100
        });
        if (res.data.success) {
          setNearbyMandis(res.data.data.nearbyMandis || []);
        }
      } catch (err) {
        console.error('Failed to update mandis:', err);
      }
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4 text-gray-500">→</div>;
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <PageTransition>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" /> Market Intelligence
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Real-time mandi prices powered by e-NAM (Government of India)
              </p>
            </div>
            {location && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {locationName}
                </span>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Location Error Alert */}
          {locationError && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm">
              {locationError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Sidebar - Current Prices */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Today's Mandi Rates</h2>
              
              {loading ? (
                 <SkeletonLoader type="text" count={5} />
              ) : (
                prices.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleCropChange(item.crop)}
                    className={`card p-4 cursor-pointer hover:border-green-500 transition-colors ${selectedCrop === item.crop ? 'border-green-500 ring-1 ring-green-500 bg-green-50 dark:bg-green-900/10' : 'border-transparent'}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{item.crop}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">per {item.unit || 'Quintal'}</p>
                      </div>
                      {getTrendIcon(item.trend)}
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mt-2 text-sm">
                      ₹{item.price?.min || item.minPrice || 0} - ₹{item.price?.max || item.maxPrice || 0}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-8">

              {/* Tab Navigation */}
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('nearby')}
                  className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                    activeTab === 'nearby' 
                      ? 'border-green-600 text-green-600 dark:text-green-400' 
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Nearby Mandis
                </button>
                <button
                  onClick={() => setActiveTab('comparison')}
                  className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                    activeTab === 'comparison' 
                      ? 'border-green-600 text-green-600 dark:text-green-400' 
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Crop Comparison
                </button>
              </div>

              {/* Nearby Mandis Tab */}
              {activeTab === 'nearby' && (
                <div className="card p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Nearby Mandis - {selectedCrop}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing mandis within 100 km
                    </p>
                  </div>

                  {locationLoading ? (
                    <SkeletonLoader type="card" count={3} />
                  ) : nearbyMandis.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {nearbyMandis.map((mandi, idx) => (
                        <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{mandi.mandiName}</h3>
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span>{mandi.district}, {mandi.state}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 justify-end text-sm font-medium text-blue-600 dark:text-blue-400">
                                <Navigation className="w-4 h-4" />
                                {mandi.distance} km away
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-900/50 rounded p-3">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Min Price</p>
                              <p className="font-bold text-gray-900 dark:text-white">₹{mandi.minPrice}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Modal Price</p>
                              <p className="font-bold text-green-600 dark:text-green-400">₹{mandi.modalPrice}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Max Price</p>
                              <p className="font-bold text-gray-900 dark:text-white">₹{mandi.maxPrice}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className={`text-sm font-medium flex items-center gap-1 ${getTrendColor(mandi.trend)}`}>
                              {getTrendIcon(mandi.trend)}
                              {mandi.trend.charAt(0).toUpperCase() + mandi.trend.slice(1)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Updated: {new Date(mandi.updatedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No mandis found in this radius</p>
                    </div>
                  )}
                </div>
              )}

              {/* Crop Comparison Tab */}
              {activeTab === 'comparison' && (
                <div className="card p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Multi-Crop Price Comparison
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Average prices across {DEFAULT_CROPS.length} major crops in your region
                    </p>
                  </div>

                  {comparisonLoading ? (
                    <SkeletonLoader type="card" count={1} />
                  ) : cropComparison && cropComparison.length > 0 ? (
                    <div className="space-y-6">
                      {/* Bar Chart */}
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={cropComparison} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} vertical={false} />
                            <XAxis 
                              dataKey="crop" 
                              stroke="#6b7280" 
                              tick={{ fill: '#6b7280', fontSize: 12 }} 
                              angle={-45}
                              textAnchor="end"
                              height={100}
                            />
                            <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }}
                              itemStyle={{ color: '#10b981' }}
                              formatter={(value) => `₹${value}`}
                            />
                            <Legend />
                            <Bar dataKey="minPrice" fill="#60a5fa" name="Min Price" />
                            <Bar dataKey="averagePrice" fill="#10b981" name="Avg Price" />
                            <Bar dataKey="maxPrice" fill="#f59e0b" name="Max Price" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Detailed Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Crop</th>
                              <th className="text-right py-3 px-4 font-bold text-gray-900 dark:text-white">Min Price</th>
                              <th className="text-right py-3 px-4 font-bold text-gray-900 dark:text-white">Avg Price</th>
                              <th className="text-right py-3 px-4 font-bold text-gray-900 dark:text-white">Max Price</th>
                              <th className="text-center py-3 px-4 font-bold text-gray-900 dark:text-white">Trend</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cropComparison.map((row, idx) => (
                              <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.crop}</td>
                                <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">₹{row.minPrice}</td>
                                <td className="text-right py-3 px-4 font-bold text-green-600 dark:text-green-400">₹{row.averagePrice}</td>
                                <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">₹{row.maxPrice}</td>
                                <td className="text-center py-3 px-4">
                                  <span className={`inline-flex items-center gap-1 font-medium ${getTrendColor(row.trend)}`}>
                                    {getTrendIcon(row.trend)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Unable to load crop comparison data</p>
                    </div>
                  )}
                </div>
              )}

              {/* AI Forecast Chart */}
              <div className="card p-6">
                 <div className="flex justify-between items-center mb-6">
                   <div>
                     <h2 className="text-xl font-bold text-gray-900 dark:text-white">6-Month Forecast Model</h2>
                     <p className="text-sm text-gray-500 dark:text-gray-400">Projected trends for {selectedCrop}</p>
                   </div>
                 </div>

                 {forecastLoading ? (
                   <SkeletonLoader type="card" count={1} />
                 ) : forecast?.forecast ? (
                   <div className="h-80 w-full mt-4">
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={forecast.forecast} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} vertical={false} />
                         <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                         <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }}
                            itemStyle={{ color: '#10b981' }}
                            formatter={(value) => [`₹${value}`, 'Predicted Price']}
                         />
                         <Line type="monotone" dataKey="predictedPrice" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                 ) : (
                   <div className="h-80 flex items-center justify-center text-gray-500">
                      Select a crop to view forecasts.
                   </div>
                 )}
              </div>

            </div>
          </div>

          {/* Location Selector Modal */}
          {showLocationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Location</h2>
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Popular States */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Popular States:
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {INDIAN_STATES.map((state) => (
                      <button
                        key={state.name}
                        onClick={() => handleLocationChange(state)}
                        className="w-full text-left px-3 py-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 text-sm transition-colors"
                      >
                        {state.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Location */}
                <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Or Enter Custom Coordinates:
                  </label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Latitude"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Longitude"
                      value={customLng}
                      onChange={(e) => setCustomLng(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                    />
                    <button
                      onClick={handleCustomLocation}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors text-sm"
                    >
                      Apply Location
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
};

export default MarketPrediction;
