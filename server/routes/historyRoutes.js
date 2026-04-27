const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getChatHistory,
  getAppointmentHistory,
  getReviewHistory,
  getCallHistory
} = require('../controllers/historyController');

router.get('/chat', protect, getChatHistory);
router.get('/appointments', protect, getAppointmentHistory);
router.get('/reviews', protect, getReviewHistory);
router.get('/calls', protect, getCallHistory);

module.exports = router;
