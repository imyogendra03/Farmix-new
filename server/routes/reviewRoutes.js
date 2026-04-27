const express = require('express');
const router = express.Router();
const { protect, farmer } = require('../middleware/authMiddleware');
const { submitReview, getApprovedReviews, getMyReviews } = require('../controllers/reviewController');

router.get('/approved', getApprovedReviews);
router.post('/', protect, farmer, submitReview);
router.get('/mine', protect, farmer, getMyReviews);

module.exports = router;
