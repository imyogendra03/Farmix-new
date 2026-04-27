/**
 * enamService With MongoDB Caching
 * Updated version that uses MarketCache for persistent storage
 * 
 * Benefits over in-memory cache:
 * - Survives server restarts
 * - Shared across multiple server instances
 * - Better analytics (hit tracking)
 * - Automatic cleanup via TTL
 */

const axios = require('axios');
const MarketCache = require('../models/MarketCache');

// e-NAM API Base URLs
const ENAM_API_BASE = 'https://api.enam.gov.in/web';

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
 * Get all mandis from cache or API
 */
const getAllMandis = async () => {
  try {
    // Check MongoDB cache first
    let mandis = await MarketCache.getMandiCache();
    if (mandis) {
      console.log('✓ Mandis retrieved from cache');
      return mandis;
    }

    console.log('→ Fetching mandis from e-NAM API...');
    
    // Fetch from e-NAM API
    const response = await axios.get(`${ENAM_API_BASE}/Mandi/getagrimandis`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Farmix/1.0 (AgriTech Platform)',
      }
    });

    mandis = response.data?.data || response.data || [];
    
    // Cache the result in MongoDB
    await MarketCache.setMandiCache(mandis);
    console.log('✓ Mandis cached in MongoDB');

    return mandis;
  } catch (error) {
    console.error('Error fetching mandis from e-NAM:', error.message);
    // Fallback: Try to get any cached data (even if expired)
    try {
      const cachedFallback = await MarketCache.findOne({ cacheType: 'mandis' });
      if (cachedFallback) {
        console.log('⚠ Using stale cached mandi data');
        return cachedFallback.data;
      }
    } catch (e) {
      console.log('⚠ No cached data available, using mock data');
    }
    return getMockMandis();
  }
};

/**
 * Get prices for a specific crop from cache or API
 */
const getPricesByCrop = async (cropName) => {
  try {
    // Check cache first
    let prices = await MarketCache.getCropPriceCache(cropName);
    if (prices) {
      console.log(`✓ Prices for ${cropName} retrieved from cache`);
      return prices;
    }

    const commodityCode = CROP_COMMODITY_MAP[cropName.toLowerCase()] || 1;
    
    console.log(`→ Fetching prices for ${cropName} from e-NAM API...`);
    
    const response = await axios.get(`${ENAM_API_BASE}/MandiPrices`, {
      params: {
        commodityCode: commodityCode,
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Farmix/1.0 (AgriTech Platform)',
      }
    });

    prices = response.data?.data || response.data || [];
    
    // Cache the result
    await MarketCache.setCropPriceCache(cropName, prices);
    console.log(`✓ Prices for ${cropName} cached in MongoDB`);

    return prices;
  } catch (error) {
    console.error(`Error fetching prices for ${cropName}:`, error.message);
    // Fallback to mock data
    return getMockPricesByState(cropName);
  }
};

/**
 * Get prices for multiple crops by state
 */
const getPricesByState = async (state, crops = []) => {
  try {
    const prices = {};
    
    for (const crop of crops) {
      const commodityCode = CROP_COMMODITY_MAP[crop.toLowerCase()] || 1;
      
      const response = await axios.get(`${ENAM_API_BASE}/MandiPrices`, {
        params: {
          commodityCode: commodityCode,
          stateName: state,
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Farmix/1.0 (AgriTech Platform)',
        }
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
  
  return Math.round(distance * 10) / 10;
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
 * Get comprehensive market data for a location (with caching)
 */
const getMarketDataByLocation = async (latitude, longitude, crops = ['wheat', 'rice', 'maize']) => {
  try {
    // Check if comparison cache exists
    const cachedComparison = await MarketCache.getComparisonCache(latitude, longitude, crops);
    if (cachedComparison) {
      console.log('✓ Comparison data retrieved from cache');
      return cachedComparison;
    }

    console.log('→ Building market data from APIs...');

    // Get district info
    const locationInfo = await getDistrictFromCoordinates(latitude, longitude);
    
    // Get nearby mandis
    const nearbyMandis = await getNearbyMandis(latitude, longitude, 100);
    
    // Get prices for selected crops
    const pricesByDistrict = await getPricesByState(locationInfo.state, crops);
    
    // Compile data
    const marketData = {
      userLocation: {
        latitude,
        longitude,
        district: locationInfo.district,
        state: locationInfo.state,
      },
      nearbyMandis: nearbyMandis.slice(0, 10),
      pricesByDistrict: pricesByDistrict,
      timestamp: new Date(),
    };

    // Cache the comparison
    await MarketCache.setComparisonCache(latitude, longitude, crops, marketData, locationInfo);
    console.log('✓ Market data cached in MongoDB');

    return marketData;
  } catch (error) {
    console.error('Error getting market data by location:', error.message);
    throw error;
  }
};

/**
 * MOCK DATA FUNCTIONS (Fallback)
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
  // Cache management functions
  MarketCache,
};
