const express = require('express');
const router = express.Router();
const { getYieldPrediction } = require('../controllers/yieldController');
const { protect } = require('../middleware/authMiddleware');

router.post('/predict', protect, getYieldPrediction);

module.exports = router;
