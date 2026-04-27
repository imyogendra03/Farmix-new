const express = require('express');
const router = express.Router();
const { 
  sendMessage, getMessages, replyMessage, markAsRead, getMyMessages, 
  initMessage, userReply, updateMessage, deleteMessage, updateReply, deleteReply 
} = require('../controllers/messageController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route to send message
router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, sendMessage);

// General User & Admin protected routes
router.get('/my', protect, getMyMessages);
router.put('/:id', protect, updateMessage);
router.delete('/:id', protect, deleteMessage);
router.put('/:id/user-reply', protect, userReply);
router.put('/:id/replies/:replyId', protect, updateReply);
router.delete('/:id/replies/:replyId', protect, deleteReply);

// Admin exclusive routes
router.get('/', protect, admin, getMessages);
router.put('/:id/reply', protect, admin, replyMessage);
router.post('/admin-init', protect, admin, initMessage);
router.put('/:id/read', protect, admin, markAsRead);

module.exports = router;
