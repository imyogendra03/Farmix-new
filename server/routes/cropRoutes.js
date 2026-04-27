const express = require('express');
const router = express.Router();
const { getCropRecommendation } = require('../controllers/cropController');
const { protect } = require('../middleware/authMiddleware');

router.post('/recommend', protect, getCropRecommendation);

module.exports = router;
