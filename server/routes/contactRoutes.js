const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Submit contact form (public)
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, message, rating, subject } = req.body;
    if (!name || !email || !message) {
      res.status(400);
      throw new Error('Name, email, and message are required');
    }

    const contact = await Contact.create({
      name,
      email,
      phone: phone || '',
      message: subject ? `[${subject}] ${message}` : message,
      rating: rating || 5
    });

    res.status(201).json({
      success: true,
      data: { ticketId: contact.ticketId },
      message: `Message received! Ticket ID: ${contact.ticketId}`
    });
  } catch (error) {
    next(error);
  }
});

// Get contact status (public)
router.get('/:ticketId', async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ ticketId: req.params.ticketId });
    if (!contact) {
      res.status(404);
      throw new Error('Ticket not found');
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
