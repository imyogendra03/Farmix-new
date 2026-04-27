const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateRequest');
const {
  sendChatMessageValidator,
  chatAppointmentIdValidator
} = require('../middleware/chatValidators');
const {
  sendChatMessage,
  getChatMessages
} = require('../controllers/chatController');

router.post('/send', protect, sendChatMessageValidator, validate, sendChatMessage);
router.get('/:appointmentId', protect, chatAppointmentIdValidator, validate, getChatMessages);

module.exports = router;
