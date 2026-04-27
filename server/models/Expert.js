const mongoose = require('mongoose');

const expertSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    professionalInfo: {
      expertiseAreas: {
        type: [String],
        default: [],
        validate: {
          validator: (value) => Array.isArray(value),
          message: 'Expertise areas must be an array'
        }
      },
      qualifications: {
        type: [String],
        default: []
      },
      licenseNumber: { type: String, trim: true, default: '' },
      licenseVerified: { type: Boolean, default: false },
      experienceYears: { type: Number, min: 0, default: 0 },
      achievements: {
        type: [String],
        default: []
      }
    },

    verification: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verificationLevel: {
        type: String,
        enum: ['beginner', 'trusted', 'pro', 'top_expert'],
        default: 'beginner'
      },
      rejectionReason: { type: String, default: '' }
    },

    consultation: {
      fee: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      consultationTypes: {
        type: [String],
        enum: ['chat', 'call', 'video'],
        default: ['chat']
      },
      availableSlots: [{
        day: {
          type: String,
          trim: true,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        startTime: { type: String, trim: true },
        endTime: { type: String, trim: true }
      }],
      callNumber: { type: String, trim: true, default: '' },
      avgResponseTime: { type: Number, default: 0 }
    },

    ratings: {
      averageRating: { type: Number, default: 0 },
      totalRatings: { type: Number, default: 0 },
      breakdown: {
        expertise: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        timeliness: { type: Number, default: 0 }
      },
      ratingCount: {
        fiveStar: { type: Number, default: 0 },
        fourStar: { type: Number, default: 0 },
        threeStar: { type: Number, default: 0 },
        twoStar: { type: Number, default: 0 },
        oneStar: { type: Number, default: 0 }
      }
    },

    performance: {
      totalConsultations: { type: Number, default: 0 },
      completedConsultations: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      averageResponseTime: { type: Number, default: 0 },
      repeatCustomerRate: { type: Number, default: 0 }
    },

    earnings: {
      totalEarned: { type: Number, default: 0 },
      earnedThisMonth: { type: Number, default: 0 },
      withdrawn: { type: Number, default: 0 },
      pendingAmount: { type: Number, default: 0 }
    },

    status: {
      isActive: { type: Boolean, default: true },
      isSuspended: { type: Boolean, default: false },
      suspensionReason: { type: String, default: '' },
      lastActive: Date
    }
  },
  { timestamps: true }
);

expertSchema.index({ 'verification.status': 1 });
expertSchema.index({ 'ratings.averageRating': -1 });
expertSchema.index({ 'verification.status': 1, 'status.isSuspended': 1, 'ratings.averageRating': -1 });

const Expert = mongoose.model('Expert', expertSchema);
module.exports = Expert;
