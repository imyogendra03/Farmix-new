const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for guest messages
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  reply: {
    type: String,
    default: null,
  },
  repliedAt: {
    type: Date,
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  replies: [
    {
      senderRole: { type: String, enum: ['user', 'admin'], required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message', messageSchema);
