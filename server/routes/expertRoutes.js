const express = require('express');
const router = express.Router();
const { protect, expert, farmer } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateRequest');
const {
  createExpertSlotsValidator,
  expertSlotsQueryValidator
} = require('../middleware/expertValidators');
const {
  getAvailableExperts,
  getFollowedExperts,
  followExpert,
  unfollowExpert,
  getExperts,
  getExpertById,
  getExpertDashboard,
  getExpertFollowers,
  updateExpertProfile,
  createExpertSlots,
  getExpertSlots,
  getAvailableSlots
} = require('../controllers/expertController');

// Protected (expert only) - Must be defined BEFORE /:id routes
router.get('/me/dashboard', protect, expert, getExpertDashboard);
router.get('/me/followers', protect, expert, getExpertFollowers);
router.put('/me/profile', protect, expert, updateExpertProfile);
router.post('/slots', protect, expert, createExpertSlotsValidator, validate, createExpertSlots);

// Public
router.get('/', getExperts);
router.get('/available', getAvailableExperts);
router.get('/following', protect, farmer, getFollowedExperts);
router.post('/:id/follow', protect, farmer, followExpert);
router.delete('/:id/follow', protect, farmer, unfollowExpert);
router.get('/slots/:expertId', expertSlotsQueryValidator, validate, getExpertSlots);
router.get('/:id', getExpertById);
router.get('/:id/slots', getAvailableSlots);

module.exports = router;
