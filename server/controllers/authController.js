const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Expert = require('../models/Expert');
const emailService = require('../services/emailService');

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const REFRESH_TTL_MS = Number(process.env.JWT_REFRESH_TTL_MS || 30 * 24 * 60 * 60 * 1000);
const REGISTRATION_OTP_TTL_MS = 10 * 60 * 1000;

// Generate tokens
const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
};

const addRefreshTokenForUser = async (user, plainToken, req) => {
  const now = Date.now();
  user.refreshTokens = (user.refreshTokens || []).filter((entry) => {
    if (!entry) return false;
    if (entry.revokedAt) return false;
    if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= now) return false;
    return true;
  });

  user.refreshTokens.push({
    tokenHash: hashToken(plainToken),
    userAgent: req.headers['user-agent'] || '',
    ipAddress: getClientIp(req),
    expiresAt: new Date(now + REFRESH_TTL_MS)
  });

  await user.save({ validateBeforeSave: false });
};

const rotateRefreshTokenForUser = async (user, currentToken, nextToken, req) => {
  const currentHash = hashToken(currentToken);
  const nextHash = hashToken(nextToken);
  const now = new Date();

  const tokenIndex = (user.refreshTokens || []).findIndex(
    (entry) => entry && entry.tokenHash === currentHash && !entry.revokedAt && new Date(entry.expiresAt) > now
  );

  if (tokenIndex === -1) {
    return false;
  }

  user.refreshTokens[tokenIndex].revokedAt = now;
  user.refreshTokens[tokenIndex].replacedByTokenHash = nextHash;

  user.refreshTokens.push({
    tokenHash: nextHash,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: getClientIp(req),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS)
  });

  await user.save({ validateBeforeSave: false });
  return true;
};

const passwordPolicyMessage = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
const isStrongPassword = (value = '') => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);

const issueRegistrationOtp = async (user) => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.phoneOTP = otp;
  user.phoneOTPExpires = new Date(Date.now() + REGISTRATION_OTP_TTL_MS);
  user.phoneOTPAttempts = 0;
  await user.save({ validateBeforeSave: false });
  const delivery = await emailService.sendOTPEmail(user.email, otp, user.phone || 'registration');
  const status = delivery?.status || 'failed';
  if (!['sent', 'queued'].includes(status)) {
    throw new Error('OTP email could not be delivered. Please check email configuration and try again.');
  }
};

// ─── FARMER REGISTRATION ─────────────────────────────────────
const registerFarmer = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      location,
      cropType,
      crop_type: cropTypeLegacy,
      landArea,
      land_area: landAreaLegacy
    } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    if (!isStrongPassword(password)) {
      res.status(400);
      throw new Error(passwordPolicyMessage);
    }

    const normalizedEmail = email.toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      if (!userExists.emailVerified) {
        await issueRegistrationOtp(userExists);
        return res.status(200).json({
          success: true,
          data: {
            _id: userExists._id,
            name: userExists.name,
            email: userExists.email,
            role: userExists.role,
            phone: userExists.phone,
            emailVerified: false,
            requiresOTP: true
          },
          message: 'This email is pending verification. A fresh OTP has been sent.'
        });
      }
      res.status(400);
      throw new Error('An account with this email already exists');
    }

    let user;
    try {
      user = await User.create({
        name,
        email: normalizedEmail,
        password,
        phone: phone || '',
        role: 'farmer',
        address: location ? {
          city: location.city || '',
          state: location.state || '',
          latitude: location.latitude || null,
          longitude: location.longitude || null
        } : {},
        farmInfo: {
          primaryCrops: (cropType || cropTypeLegacy) ? [cropType || cropTypeLegacy] : [],
          landArea: landArea || landAreaLegacy || 0
        },
        emailVerified: false,
        isVerified: false,
        phoneVerified: false
      });

      await issueRegistrationOtp(user);
    } catch (otpError) {
      if (user?._id) {
        await User.findByIdAndDelete(user._id);
      }
      throw otpError;
    }

    const message = 'OTP sent to your email. Complete OTP verification to finish registration and login.';

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        emailVerified: user.emailVerified,
        requiresOTP: true
      },
      message
    });
  } catch (error) {
    next(error);
  }
};

// ─── EXPERT REGISTRATION ──────────────────────────────────────
const registerExpert = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      expertiseAreas = req.body.expertise_areas || [],
      qualifications = [],
      experienceYears = req.body.experience_years || 0,
      availabilityHours = req.body.availability_hours || [],
      consultationFee = req.body.consultation_fee || 0,
      licenseNumber = req.body.license_number
    } = req.body;

    if (!name || !email || !password || !phone || !licenseNumber) {
      res.status(400);
      throw new Error('Please provide name, email, password, phone, and license number');
    }

    if (!isStrongPassword(password)) {
      res.status(400);
      throw new Error(passwordPolicyMessage);
    }

    if (!Array.isArray(expertiseAreas) || expertiseAreas.length === 0) {
      res.status(400);
      throw new Error('At least one expertise area is required');
    }

    const normalizedEmail = email.toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      if (!userExists.emailVerified && userExists.role === 'expert') {
        await issueRegistrationOtp(userExists);
        return res.status(200).json({
          success: true,
          data: {
            userId: userExists._id,
            role: userExists.role,
            emailVerified: false,
            requiresOTP: true
          },
          message: 'This expert email is pending verification. A fresh OTP has been sent.'
        });
      }
      res.status(400);
      throw new Error('An account with this email already exists');
    }

    let user;
    let expert;
    try {
      user = await User.create({
        name,
        email: normalizedEmail,
        password,
        phone,
        role: 'expert',
        isVerified: false,
        emailVerified: false,
        phoneVerified: false
      });

      expert = await Expert.create({
        userId: user._id,
        professionalInfo: {
          expertiseAreas,
          qualifications: Array.isArray(qualifications) ? qualifications : [],
          licenseNumber,
          experienceYears: Number(experienceYears || 0)
        },
        consultation: {
          fee: Number(consultationFee || 0),
          availableSlots: Array.isArray(availabilityHours) ? availabilityHours : []
        },
        verification: {
          status: 'pending'
        }
      });

      await issueRegistrationOtp(user);
    } catch (otpError) {
      if (expert?._id) {
        await Expert.findByIdAndDelete(expert._id);
      }
      if (user?._id) {
        await User.findByIdAndDelete(user._id);
      }
      throw otpError;
    }
    const message = 'OTP sent to your email. Verify OTP to submit expert registration for admin approval.';

    res.status(201).json({
      success: true,
      data: {
        userId: user._id,
        expertId: expert._id,
        role: user.role,
        verificationStatus: expert.verification.status,
        emailVerified: user.emailVerified,
        requiresOTP: true
      },
      message
    });
  } catch (error) {
    next(error);
  }
};

// ─── VERIFY REGISTRATION OTP ──────────
const verifyRegistrationOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400);
      throw new Error('Email and OTP are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      return res.json({
        success: true,
        data: {
          emailVerified: true,
          role: user.role
        },
        message: user.role === 'expert'
          ? 'Email already verified. Wait for admin approval before login.'
          : 'Email already verified. You can login now.'
      });
    }

    if (!user.phoneOTP || !user.phoneOTPExpires) {
      res.status(400);
      throw new Error('No OTP found. Please request a new OTP.');
    }

    if (new Date(user.phoneOTPExpires) < new Date()) {
      res.status(400);
      throw new Error('OTP has expired. Please request a new OTP.');
    }

    if (String(user.phoneOTP) !== String(otp).trim()) {
      user.phoneOTPAttempts = Number(user.phoneOTPAttempts || 0) + 1;
      await user.save({ validateBeforeSave: false });
      res.status(400);
      throw new Error('Invalid OTP. Please try again.');
    }

    user.emailVerified = true;
    user.phoneVerified = true;
    user.phoneOTP = undefined;
    user.phoneOTPExpires = undefined;
    user.phoneOTPAttempts = 0;
    user.isVerified = user.role === 'farmer';
    await user.save({ validateBeforeSave: false });

    if (user.role === 'farmer') {
      emailService.sendFarmerRegistrationSuccess(user).catch((err) => {
        console.error('Failed to send farmer registration success email:', err.message);
      });
    } else {
      emailService.sendExpertRegistrationPending(user).catch((err) => {
        console.error('Failed to send expert pending email:', err.message);
      });

      Expert.findOne({ userId: user._id })
        .then((expertProfile) => {
          if (!expertProfile) return null;
          return emailService.sendExpertRegistrationAdminAlert(user, expertProfile);
        })
        .catch((err) => {
          console.error('Failed to send expert admin alert email:', err.message);
        });
    }

    return res.json({
      success: true,
      data: {
        emailVerified: true,
        role: user.role
      },
      message: user.role === 'expert'
        ? 'Email verified. Your expert account now waits for admin approval.'
        : 'Email verified successfully. You can login now.'
    });
  } catch (error) {
    next(error);
  }
};

// ─── UNIFIED LOGIN ────────────────────────────────────────────
const loginUser = async (req, res, next) => {
  console.log('\n✅ [loginUser CALLED] Time:', new Date().toISOString());
  try {
    const { email, password, loginAs } = req.body;
    console.log('📧 Email:', email);
    console.log('🔐 Password length:', password ? password.length : 0);
    console.log('👤 LoginAs:', loginAs);

    // Validate input
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401);
      throw new Error('User not found with this email');
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      res.status(401);
      throw new Error('Password is incorrect');
    }

    if (!user.emailVerified) {
      res.status(403);
      throw new Error('Please verify your registration email with OTP before login');
    }

    // Check if blocked
    if (user.isBlocked) {
      res.status(403);
      throw new Error('Your account has been blocked. Please contact support.');
    }

    // Validate loginAs role (for role-specific endpoints)
    if (loginAs && user.role !== loginAs && user.role !== 'admin') {
      res.status(403);
      throw new Error(`This account is registered as ${user.role}, not ${loginAs}`);
    }

    // Update last login
    user.lastLogin = new Date();
    user.lastLoginMeta = {
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      loginMethod: 'Direct'
    };
    await user.save({ validateBeforeSave: false });

    // Send login notification
    emailService.sendLoginNotification(user, user.lastLoginMeta).catch(console.error);

    // Check expert verification
    if (user.role === 'expert') {
      const expertData = await Expert.findOne({ userId: user._id });
      if (!expertData || expertData.verification?.status !== 'approved') {
        res.status(403);
        throw new Error('Expert account is pending admin approval');
      }
    }

    // Generate tokens for all users (admin, farmer, expert)
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    await addRefreshTokenForUser(user, refreshToken, req);

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        emailVerified: user.emailVerified,
        isVerified: user.isVerified,
        token: accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── VERIFY LOGIN OTP (DEPRECATED - NOT USED) ─────────────────
const verifyLoginOTP = async (req, res, next) => {
  res.status(400).json({
    success: false,
    message: 'OTP verification is no longer required. Use your email and password to login.'
  });
};

// ─── GET CURRENT USER ─────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshTokens -verificationToken -passwordResetToken');

    let expertData = null;
    if (user.role === 'expert') {
      expertData = await Expert.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        expertProfile: expertData
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error('Please provide an email address');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'If the email is registered, a reset link has been sent' });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    emailService.sendPasswordResetEmail(user, resetToken).catch(console.error);

    res.json({ success: true, message: 'If the email is registered, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400);
      throw new Error('Please provide token and new password');
    }

    if (!isStrongPassword(newPassword)) {
      res.status(400);
      throw new Error(passwordPolicyMessage);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = [];
    await user.save();

    emailService.sendPasswordChangedEmail(user).catch(console.error);

    res.json({ success: true, message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    next(error);
  }
};

// ─── VERIFY EMAIL ─────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400);
      throw new Error('Verification token is required');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const allowedFields = ['name', 'phone', 'bio', 'language', 'address', 'farmInfo', 'settings', 'profilePhoto'];

    const updateObj = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        updateObj[key] = updates[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateObj, {
      new: true,
      runValidators: true
    }).select('-password -refreshTokens -verificationToken -passwordResetToken');

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE EMAIL PREFERENCES ───────────────────────────────
const updateEmailPreferences = async (req, res, next) => {
  try {
    const { appointmentReminder, marketUpdates, weatherAlerts, newsletter, promotional } = req.body;
    const updates = {};

    if (typeof appointmentReminder === 'boolean') updates['settings.emailAlerts.appointmentReminder'] = appointmentReminder;
    if (typeof marketUpdates === 'boolean') updates['settings.emailAlerts.marketUpdates'] = marketUpdates;
    if (typeof weatherAlerts === 'boolean') updates['settings.emailAlerts.weatherAlerts'] = weatherAlerts;
    if (typeof newsletter === 'boolean') updates['settings.emailAlerts.newsletter'] = newsletter;
    if (typeof promotional === 'boolean') updates['settings.emailAlerts.promotional'] = promotional;

    if (!Object.keys(updates).length) {
      res.status(400);
      throw new Error('At least one email preference field is required');
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true })
      .select('settings.emailAlerts');

    res.json({ success: true, data: user.settings.emailAlerts });
  } catch (error) {
    next(error);
  }
};

// ─── UNSUBSCRIBE EMAIL CATEGORY ─────────────────────────────
const unsubscribeEmailAlerts = async (req, res, next) => {
  try {
    const token = req.body?.token || req.query?.token;
    const category = req.body?.category || req.query?.category || 'newsletter';
    const allowed = ['appointmentReminder', 'marketUpdates', 'weatherAlerts', 'newsletter', 'promotional'];

    if (!allowed.includes(category)) {
      res.status(400);
      throw new Error('Unsupported email category');
    }

    const payload = emailService.verifyUnsubscribeToken(token);
    if (!payload?.userId) {
      res.status(400);
      throw new Error('Invalid unsubscribe token');
    }

    const updatePath = `settings.emailAlerts.${category}`;
    const user = await User.findByIdAndUpdate(payload.userId, { $set: { [updatePath]: false } }, { new: true })
      .select('settings.emailAlerts email');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({
      success: true,
      message: `You have been unsubscribed from ${category} emails`,
      data: {
        email: user.email,
        preferences: user.settings.emailAlerts
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────
const refreshTokenHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400);
      throw new Error('Refresh token required');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    const newRefreshToken = generateRefreshToken(user._id);
    const rotated = await rotateRefreshTokenForUser(user, refreshToken, newRefreshToken, req);
    if (!rotated) {
      res.status(401);
      throw new Error('Invalid or expired refresh token');
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    res.json({ success: true, data: { token: newAccessToken, refreshToken: newRefreshToken } });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400);
      throw new Error('Refresh token required');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (_error) {
      // Even if token is invalid, respond success to avoid account enumeration.
      return res.json({ success: true, message: 'Logged out successfully' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.json({ success: true, message: 'Logged out successfully' });
    }

    const hashed = hashToken(refreshToken);
    user.refreshTokens = (user.refreshTokens || []).map((entry) => {
      if (entry.tokenHash === hashed && !entry.revokedAt) {
        entry.revokedAt = new Date();
      }
      return entry;
    });

    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── SEND OTP FOR PHONE VERIFICATION (DEPRECATED - NOT USED) ────
const sendPhoneOTP = async (req, res, next) => {
  res.status(400).json({
    success: false,
    message: 'OTP system has been removed. No OTP verification is needed.'
  });
};

// ─── VERIFY PHONE OTP (DEPRECATED - NOT USED) ──────────────────
const verifyPhoneOTP = async (req, res, next) => {
  res.status(400).json({
    success: false,
    message: 'OTP system has been removed. No OTP verification is needed.'
  });
};

// ─── RESEND OTP (DEPRECATED - NOT USED) ────────────────────────
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      res.status(400);
      throw new Error('This account is already verified');
    }

    await issueRegistrationOtp(user);

    res.json({
      success: true,
      message: 'A new OTP has been sent to your email'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerFarmer,
  registerExpert,
  verifyRegistrationOTP,
  loginUser,
  verifyLoginOTP,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updateProfile,
  updateEmailPreferences,
  unsubscribeEmailAlerts,
  refreshTokenHandler,
  logoutUser,
  sendPhoneOTP,
  verifyPhoneOTP,
  resendOTP
};


