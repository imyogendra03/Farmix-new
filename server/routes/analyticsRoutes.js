const express = require('express');
const router = express.Router();
const { getTrends } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/trends', protect, admin, getTrends);

module.exports = router;
