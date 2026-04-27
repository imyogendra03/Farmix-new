const mongoose = require('mongoose');

const expertSlotSchema = new mongoose.Schema(
  {
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format']
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{2}:\d{2}$/, 'End time must be in HH:MM format']
    },
    status: {
      type: String,
      enum: ['available', 'booked', 'blocked'],
      default: 'available'
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ''
    }
  },
  { timestamps: true }
);

expertSlotSchema.index(
  { expertId: 1, date: 1, startTime: 1, endTime: 1 },
  { unique: true }
);
expertSlotSchema.index({ expertId: 1, date: 1, status: 1 });

const ExpertSlot = mongoose.model('ExpertSlot', expertSlotSchema);

module.exports = ExpertSlot;
