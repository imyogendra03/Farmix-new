const express = require('express');
const router = express.Router();
const { getSatelliteData } = require('../controllers/satelliteController');

router.get('/data', getSatelliteData);

module.exports = router;
