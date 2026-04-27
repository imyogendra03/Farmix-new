/**
 * e-NAM API Integration Service
 * Fetches real-time mandi prices and agricultural commodity data
 * Government of India - Ministry of Agriculture & Farmers Welfare
 */

const axios = require('axios');

// e-NAM API Base URL (can be overridden via env; useful if you proxy e-NAM)
const ENAM_API_BASE_URL = (process.env.ENAM_API_BASE_URL || 'https://api.enam.gov.in/web').replace(/\/$/, '');
const ENAM_API_TIMEOUT_MS = Number(process.env.ENAM_API_TIMEOUT_MS || 10000);
const ENAM_API_KEY = (process.env.ENAM_API_KEY || '').trim();

const getEnamHeaders = () => {
  const headers = {
    'User-Agent': 'Farmix/1.0 (AgriTech Platform)'
  };

  if (ENAM_API_KEY) {
    headers['x-api-key'] = ENAM_API_KEY;
  }

  return headers;
};

// Mandi data cache (with timestamps for TTL)
const mandiCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Crop to commodity code mapping
const CROP_COMMODITY_MAP = {
  'wheat': 1,
  'rice': 2,
  'maize': 3,
  'cotton': 4,
  'sugarcane': 5,
  'soybean': 6,
  'jute': 7,
  'lentil': 8,
  'gram': 9,
  'turmeric': 10,
  'onion': 11,
  'potato': 12,
  'tomato': 13,
  'chili': 14,
  'garlic': 15,
};

/**
 * Get all mandis from e-NAM (with caching)
 */
const getAllMandis = async () => {
  try {
    const cacheKey = 'allMandis';
    
    // Check if cached and not expired
    if (mandiCache.has(cacheKey)) {
      const cached = mandiCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    // Fetch from e-NAM API
    const response = await axios.get(`${ENAM_API_BASE_URL}/Mandi/getagrimandis`, {
      timeout: ENAM_API_TIMEOUT_MS,
      headers: getEnamHeaders()
    });

    const mandis = response.data?.data || response.data || [];
    
    // Cache the result
    mandiCache.set(cacheKey, {
      data: mandis,
      timestamp: Date.now()
    });

    return mandis;
  } catch (error) {
    console.error('Error fetching mandis from e-NAM:', error.message);
    // Return mock data as fallback
    return getMockMandis();
  }
};

/**
 * Get prices for a specific crop in all mandis
 */
const getPricesByCrop = async (cropName) => {
  try {
    const commodityCode = CROP_COMMODITY_MAP[cropName.toLowerCase()] || 1;
    
    const response = await axios.get(`${ENAM_API_BASE_URL}/MandiPrices`, {
      params: {
        commodityCode: commodityCode,
      },
      timeout: ENAM_API_TIMEOUT_MS,
      headers: getEnamHeaders()
    });

    return response.data?.data || response.data || [];
  } catch (error) {
    console.error(`Error fetching prices for ${cropName}:`, error.message);
    return getMockPricesByState(cropName);
  }
};

/**
 * Get prices for multiple crops in a specific state
 */
const getPricesByState = async (state, crops = []) => {
  try {
    const prices = {};
    
    for (const crop of crops) {
      const commodityCode = CROP_COMMODITY_MAP[crop.toLowerCase()] || 1;
      
      const response = await axios.get(`${ENAM_API_BASE_URL}/MandiPrices`, {
        params: {
          commodityCode: commodityCode,
          stateName: state,
        },
        timeout: ENAM_API_TIMEOUT_MS,
        headers: getEnamHeaders()
      });

      prices[crop] = response.data?.data || [];
    }

    return prices;
  } catch (error) {
    console.error(`Error fetching prices for state ${state}:`, error.message);
    return getMockPricesByState();
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Get nearby mandis within X km of user location
 */
const getNearbyMandis = async (latitude, longitude, radiusKm = 50) => {
  try {
    const allMandis = await getAllMandis();
    
    const nearbyMandis = allMandis
      .filter(mandi => mandi.latitude && mandi.longitude)
      .map(mandi => ({
        ...mandi,
        distance: calculateDistance(latitude, longitude, mandi.latitude, mandi.longitude)
      }))
      .filter(mandi => mandi.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return nearbyMandis;
  } catch (error) {
    console.error('Error finding nearby mandis:', error.message);
    return [];
  }
};

/**
 * Get district from coordinates using reverse geocoding
 */
const getDistrictFromCoordinates = async (latitude, longitude) => {
  try {
    // Using Nominatim (free reverse geocoding)
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
      },
      timeout: 5000,
      headers: {
        'User-Agent': 'Farmix/1.0'
      }
    });

    const address = response.data?.address || {};
    return {
      district: address.county || address.district || 'Unknown',
      state: address.state || 'Unknown',
      country: address.country || 'India'
    };
  } catch (error) {
    console.error('Error getting district from coordinates:', error.message);
    return {
      district: 'Unknown',
      state: 'Unknown',
      country: 'India'
    };
  }
};

/**
 * Get comprehensive market data for a location
 */
const getMarketDataByLocation = async (latitude, longitude, crops = ['wheat', 'rice', 'maize']) => {
  try {
    // Get district info
    const locationInfo = await getDistrictFromCoordinates(latitude, longitude);
    
    // Get nearby mandis
    const nearbyMandis = await getNearbyMandis(latitude, longitude, 100);
    
    // Get prices for selected crops across mandis in district
    const pricesByDistrict = await getPricesByState(locationInfo.state, crops);
    
    // Compile comprehensive data
    const marketData = {
      userLocation: {
        latitude,
        longitude,
        district: locationInfo.district,
        state: locationInfo.state,
      },
      nearbyMandis: nearbyMandis.slice(0, 10), // Top 10 nearest
      pricesByDistrict: pricesByDistrict,
      timestamp: new Date(),
    };

    return marketData;
  } catch (error) {
    console.error('Error getting market data by location:', error.message);
    throw error;
  }
};

/**
 * MOCK DATA FUNCTIONS (Fallback when API fails)
 */

const getMockMandis = () => {
  return [
    { id: 1, name: 'Lucknow Mandi', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462, district: 'Lucknow' },
    { id: 2, name: 'Kanpur Mandi', state: 'Uttar Pradesh', latitude: 26.4499, longitude: 80.3319, district: 'Kanpur' },
    { id: 3, name: 'Meerut Mandi', state: 'Haryana', latitude: 28.9845, longitude: 77.7064, district: 'Meerut' },
    { id: 4, name: 'Indore Mandi', state: 'Madhya Pradesh', latitude: 22.7196, longitude: 75.8577, district: 'Indore' },
    { id: 5, name: 'Rajkot Mandi', state: 'Gujarat', latitude: 22.3039, longitude: 71.8024, district: 'Rajkot' },
    { id: 6, name: 'Ujjain Mandi', state: 'Madhya Pradesh', latitude: 23.1815, longitude: 75.7733, district: 'Ujjain' },
    { id: 7, name: 'Karnal Mandi', state: 'Haryana', latitude: 29.6200, longitude: 77.1040, district: 'Karnal' },
  ];
};

const getMockPricesByState = (crop = 'wheat') => {
  const mockPrices = {
    wheat: [
      { id: 1, mandiName: 'Lucknow Mandi', crop: 'Wheat (Sharbati)', minPrice: 2450, maxPrice: 2800, modal: 2625, unit: 'Quintal', state: 'UP', trend: 'up' },
      { id: 2, mandiName: 'Kanpur Mandi', crop: 'Wheat (Sharbati)', minPrice: 2400, maxPrice: 2750, modal: 2575, unit: 'Quintal', state: 'UP', trend: 'stable' },
      { id: 3, mandiName: 'Meerut Mandi', crop: 'Wheat (Sharbati)', minPrice: 2500, maxPrice: 2850, modal: 2675, unit: 'Quintal', state: 'Haryana', trend: 'up' },
    ],
    rice: [
      { id: 1, mandiName: 'Lucknow Mandi', crop: 'Basmati Rice', minPrice: 3200, maxPrice: 4100, modal: 3650, unit: 'Quintal', state: 'UP', trend: 'down' },
      { id: 2, mandiName: 'Kanpur Mandi', crop: 'Basmati Rice', minPrice: 3150, maxPrice: 4050, modal: 3600, unit: 'Quintal', state: 'UP', trend: 'stable' },
    ],
    maize: [
      { id: 1, mandiName: 'Indore Mandi', crop: 'Maize (Yellow)', minPrice: 1950, maxPrice: 2300, modal: 2125, unit: 'Quintal', state: 'MP', trend: 'stable' },
      { id: 2, mandiName: 'Ujjain Mandi', crop: 'Maize (Yellow)', minPrice: 1900, maxPrice: 2250, modal: 2075, unit: 'Quintal', state: 'MP', trend: 'down' },
    ],
  };

  return mockPrices[crop.toLowerCase()] || mockPrices.wheat;
};

module.exports = {
  getAllMandis,
  getPricesByCrop,
  getPricesByState,
  getNearbyMandis,
  getDistrictFromCoordinates,
  getMarketDataByLocation,
  calculateDistance,
  CROP_COMMODITY_MAP,
};
