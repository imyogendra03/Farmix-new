const express = require('express');
const router = express.Router();
const { 
  getMarketPrices, 
  getLocationBasedPrices, 
  getNearbyMandisWithPrices, 
  getCropComparison,
  predictMarketPrice 
} = require('../controllers/marketController');

// Original endpoints
router.get('/prices', getMarketPrices);
router.get('/predict', predictMarketPrice);

// Location-based endpoints (e-NAM integration)
router.post('/location-prices', getLocationBasedPrices);
router.post('/nearby-mandis', getNearbyMandisWithPrices);
router.post('/crop-comparison', getCropComparison);

module.exports = router;
