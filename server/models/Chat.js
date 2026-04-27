const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    senderRole: {
      type: String,
      enum: ['farmer', 'expert', 'admin'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text'
    },
    attachments: [
      {
        url: { type: String, trim: true, default: '' },
        name: { type: String, trim: true, default: '' },
        mimeType: { type: String, trim: true, default: '' }
      }
    ],
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        readAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

chatSchema.index({ appointmentId: 1, createdAt: 1 });
chatSchema.index({ appointmentId: 1, senderRole: 1, createdAt: 1 });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
