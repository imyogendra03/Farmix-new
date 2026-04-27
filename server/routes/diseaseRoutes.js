const express = require('express');
const router = express.Router();
const { getDiseasePrediction } = require('../controllers/diseaseController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/predict', protect, upload.single('image'), getDiseasePrediction);

module.exports = router;
