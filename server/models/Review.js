const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true
    },
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

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    feedback: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000
    },

    categoryRatings: {
      expertise: { type: Number, min: 1, max: 5, default: 5 },
      communication: { type: Number, min: 1, max: 5, default: 5 },
      timeliness: { type: Number, min: 1, max: 5, default: 5 }
    },

    wouldRecommend: { type: Boolean, default: true },

    reviewType: {
      type: String,
      enum: ['expert_consultation', 'platform'],
      default: 'expert_consultation'
    },

    moderation: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
      rejectionReason: { type: String, default: '' },
      isVisible: { type: Boolean, default: false }
    },

    metrics: {
      helpfulCount: { type: Number, default: 0 },
      unhelpfulCount: { type: Number, default: 0 },
      reportCount: { type: Number, default: 0 },
      reportedReasons: [String]
    }
  },
  { timestamps: true }
);

reviewSchema.index({ expertId: 1, 'moderation.status': 1 });
reviewSchema.index({ farmerId: 1 });
reviewSchema.index({ 'moderation.status': 1 });
reviewSchema.index({ expertId: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
