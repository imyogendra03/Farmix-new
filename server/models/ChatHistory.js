const mongoose = require('mongoose');

const chatHistorySchema = mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    messages: [{
      senderType: { type: String, enum: ['farmer', 'ai', 'expert'] },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      messageText: { type: String, default: '' },
      messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
      attachments: [{
        type: { type: String },
        url: String,
        name: String
      }],
      timestamp: { type: Date, default: Date.now },
      read: { type: Boolean, default: false }
    }],

    context: {
      cropType: { type: String, default: '' },
      location: { type: String, default: '' },
      weatherData: { type: mongoose.Schema.Types.Mixed, default: {} },
      issueCategory: { type: String, default: '' }
    },

    aiMetadata: {
      modelUsed: { type: String, default: 'farmix-ai-v1' },
      confidenceScore: { type: Number, default: 0 },
      sources: [String],
      version: { type: String, default: '1.0' }
    },

    expertInvolved: { type: Boolean, default: false },
    expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    appointmentLinked: { type: Boolean, default: false },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },

    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

chatHistorySchema.index({ farmerId: 1 });
chatHistorySchema.index({ lastMessageAt: -1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
module.exports = ChatHistory;
