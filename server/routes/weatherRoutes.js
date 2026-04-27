const express = require('express');
const router = express.Router();
const { getWeatherData, getWeatherAlerts } = require('../controllers/weatherController');

// Public weather routes
router.get('/data', getWeatherData);
router.get('/alerts', getWeatherAlerts);

module.exports = router;
