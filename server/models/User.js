const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [80, 'Name cannot exceed 80 characters']
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      validate: {
        validator: function (value) {
          // Require at least one uppercase, one lowercase, one number, and one special character.
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);
        },
        message: 'Password must include uppercase, lowercase, number, and special character'
      }
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
      default: ''
    },
    role: {
      type: String,
      enum: ['farmer', 'expert', 'admin'],
      default: 'farmer'
    },

    // Profile
    profilePhoto: {
      type: String,
      trim: true,
      default: ''
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en'
    },

    // Address & Location
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, maxlength: [12, 'Pincode cannot exceed 12 characters'], default: '' },
      country: { type: String, trim: true, default: 'India' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null }
    },

    // Account Status
    isVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String, default: '' },

    // Verification
    verificationToken: String,
    verificationTokenExpires: Date,

    // Phone OTP for Registration & Login (Email-based)
    phoneOTP: String,
    phoneOTPExpires: Date,
    phoneOTPAttempts: { type: Number, default: 0 },
    phoneVerified: { type: Boolean, default: false },

    // Password Reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Farmer-specific fields
    farmInfo: {
      landArea: { type: Number, default: 0 },
      landUnit: { type: String, enum: ['hectares', 'acres', 'bigha'], default: 'hectares' },
      soilType: { type: String, trim: true, default: '' },
      primaryCrops: {
        type: [String],
        default: []
      },
      irrigationType: { type: String, trim: true, default: '' }
    },

    followingExperts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    // Stats
    stats: {
      totalAiChats: { type: Number, default: 0 },
      totalConsultations: { type: Number, default: 0 },
      totalReviewsGiven: { type: Number, default: 0 },
      totalYieldPredictions: { type: Number, default: 0 },
      diseaseDetections: { type: Number, default: 0 }
    },

    // Settings
    settings: {
      darkMode: { type: Boolean, default: false },
      notificationsEnabled: { type: Boolean, default: true },
      emailAlerts: {
        login: { type: Boolean, default: true },
        appointmentReminder: { type: Boolean, default: true },
        marketUpdates: { type: Boolean, default: true },
        weatherAlerts: { type: Boolean, default: true },
        newsletter: { type: Boolean, default: true },
        promotional: { type: Boolean, default: false }
      }
    },

    // Notifications
    notifications: [
      {
        message: { type: String, trim: true },
        isRead: { type: Boolean, default: false },
        type: { type: String, trim: true, default: 'info' },
        createdAt: { type: Date, default: Date.now }
      }
    ],

    // Refresh Tokens
    refreshTokens: [{
      tokenHash: { type: String, required: true },
      userAgent: { type: String, default: '' },
      ipAddress: { type: String, default: '' },
      revokedAt: Date,
      replacedByTokenHash: String,
      createdAt: { type: Date, default: Date.now },
      expiresAt: Date
    }],

    lastLogin: Date,
    lastLoginMeta: {
      ipAddress: { type: String, default: '' },
      userAgent: { type: String, default: '' },
      loginAs: { type: String, default: '' }
    }
  },
  {
    timestamps: true
  }
);

// Index for performance
userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1, role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ followingExperts: 1 });

// Encrypt password using bcrypt pre-save
// In async mongoose middleware, do not use next(); return promise instead.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate verification token
userSchema.methods.createVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return token;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
