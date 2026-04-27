const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    confirmationToken: {
      type: String,
      default: '',
      index: true
    },

    appointmentDetails: {
      date: { type: Date, required: true },
      startTime: {
        type: String,
        required: true,
        trim: true,
        match: [/^\d{2}:\d{2}(-\d{2}:\d{2})?$/, 'Start time must be in HH:MM or HH:MM-HH:MM format']
      },
      endTime: { type: String, trim: true, default: '' },
      duration: { type: Number, min: 15, max: 480, default: 30 },
      consultationType: {
        type: String,
        enum: ['chat', 'call', 'video'],
        default: 'chat'
      },
      queryDescription: { type: String, trim: true, maxlength: 1000, default: '' },
      cropType: { type: String, trim: true, maxlength: 120, default: '' },
      issueCategory: { type: String, trim: true, maxlength: 120, default: '' }
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'active', 'rejected', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending'
    },

    expertResponse: {
      responseAt: Date,
      responseStatus: {
        type: String,
        enum: ['accepted', 'declined', 'pending'],
        default: 'pending'
      },
      declineReason: { type: String, default: '' }
    },

    payment: {
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['pending', 'completed', 'refunded', 'na'],
        default: 'na'
      },
      transactionId: { type: String, default: '' },
      paymentDate: Date,
      refundDate: Date,
      refundReason: { type: String, default: '' }
    },

    consultation: {
      startTime: Date,
      endTime: Date,
      actualDuration: { type: Number, default: 0 },
      sessionLink: { type: String, default: '' },
      chatHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatHistory' },
      transcript: { type: String, default: '' }
    },

    conclusion: {
      diagnosis: { type: String, trim: true, maxlength: 2000, default: '' },
      recommendation: { type: String, trim: true, maxlength: 3000, default: '' },
      notes: { type: String, trim: true, maxlength: 3000, default: '' },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      submittedAt: Date
    },

    cancellation: {
      cancelledBy: { type: String, enum: ['farmer', 'expert', 'system', ''], default: '' },
      cancelledAt: Date,
      reason: { type: String, default: '' },
      refundIssued: { type: Boolean, default: false }
    },

    review: {
      reviewed: { type: Boolean, default: false },
      reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
      rating: { type: Number, default: 0 },
      feedback: { type: String, default: '' }
    },

    remindersSent: {
      bookingConfirmation: { type: Boolean, default: false },
      reminder24h: { type: Boolean, default: false },
      reminder1h: { type: Boolean, default: false },
      postConsultation: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

appointmentSchema.index({ farmerId: 1, status: 1 });
appointmentSchema.index({ expertId: 1, status: 1 });
appointmentSchema.index({ 'appointmentDetails.date': 1 });
appointmentSchema.index({ expertId: 1, 'appointmentDetails.date': 1, 'appointmentDetails.startTime': 1, status: 1 });
appointmentSchema.index({ farmerId: 1, 'appointmentDetails.date': -1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
