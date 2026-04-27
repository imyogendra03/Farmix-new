const express = require('express');
const router = express.Router();
const { saveLocation, getLocations, createTask, getTasks } = require('../controllers/farmController');
const { protect } = require('../middleware/authMiddleware');

router.post('/location', protect, saveLocation);
router.get('/location', protect, getLocations);
router.post('/task', protect, createTask);
router.get('/tasks', protect, getTasks);

module.exports = router;
