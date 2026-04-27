const express = require('express');
const router = express.Router();
const { getChatbotResponse } = require('../controllers/chatbotController');

// Chatbot can be public or protected depending on business logic; making it public to allow unauthenticated querying.
router.post('/query', getChatbotResponse);

module.exports = router;
