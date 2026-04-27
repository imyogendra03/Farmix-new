const express = require('express');
const router = express.Router();
const { getPredictionHistory } = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/history', protect, getPredictionHistory);

module.exports = router;
