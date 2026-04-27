const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateRequest');
const {
  farmerRegisterValidator,
  expertRegisterValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  refreshTokenValidator,
  logoutValidator,
  emailPreferencesValidator,
  unsubscribeValidator
} = require('../middleware/authValidators');

const enforceLoginRole = (role) => (req, _res, next) => {
  req.body.loginAs = role;
  next();
};

// Registration
router.post('/farmer/register', farmerRegisterValidator, validate, registerFarmer);
router.post('/expert/register', expertRegisterValidator, validate, registerExpert);
router.post('/verify-registration-otp', verifyRegistrationOTP);

// Login (unified)
router.post('/login', loginValidator, validate, loginUser);
router.post('/farmer/login', enforceLoginRole('farmer'), loginValidator, validate, loginUser);
router.post('/expert/login', enforceLoginRole('expert'), loginValidator, validate, loginUser);
router.post('/admin/login', enforceLoginRole('admin'), loginValidator, validate, loginUser);
router.post('/verify-login-otp', verifyLoginOTP);

// Password management
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);

// Email verification
router.post('/verify-email', verifyEmailValidator, validate, verifyEmail);
router.post('/unsubscribe', unsubscribeValidator, validate, unsubscribeEmailAlerts);
router.get('/unsubscribe', unsubscribeEmailAlerts);

// Phone OTP Verification (Email-based, FREE)
router.post('/send-otp', sendPhoneOTP);
router.post('/verify-otp', verifyPhoneOTP);
router.post('/resend-otp', resendOTP);

// Protected
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/email-preferences', protect, emailPreferencesValidator, validate, updateEmailPreferences);

// Token refresh
router.post('/refresh-token', refreshTokenValidator, validate, refreshTokenHandler);
router.post('/logout', logoutValidator, validate, logoutUser);

module.exports = router;
