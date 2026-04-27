const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['MESSAGE_REPLY', 'NEW_MESSAGE', 'SYSTEM_ALERT'],
    default: 'SYSTEM_ALERT',
  },
  message: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default: '',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
