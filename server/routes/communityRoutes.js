const express = require('express');
const router = express.Router();
const { getPosts, createPost, toggleLike, addComment } = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/posts', getPosts);
router.post('/post', protect, createPost);
router.put('/post/:id/like', protect, toggleLike);
router.post('/post/:id/comment', protect, addComment);

module.exports = router;
