const { body } = require('express-validator');

const passwordPolicyMessage =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';

const isStrongPassword = (value) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').custom((value) => {
    if (!isStrongPassword(value)) {
      throw new Error(passwordPolicyMessage);
    }
    return true;
  })
];

const farmerRegisterValidator = [
  ...registerValidator,
  body('phone').optional().trim().isLength({ min: 7, max: 20 }).withMessage('phone must be 7-20 characters'),
  body('cropType').optional().trim().isLength({ max: 80 }).withMessage('cropType can be at most 80 characters'),
  body('landArea').optional().isFloat({ min: 0 }).withMessage('landArea must be a positive number'),
  body('location').optional().isObject().withMessage('location must be an object'),
  body('location.city').optional().trim().isLength({ max: 80 }).withMessage('location.city can be at most 80 characters'),
  body('location.state').optional().trim().isLength({ max: 80 }).withMessage('location.state can be at most 80 characters')
];

const expertRegisterValidator = [
  ...registerValidator,
  body('phone').trim().notEmpty().withMessage('phone is required'),
  body().custom((_, { req }) => {
    const value = req.body.expertiseAreas || req.body.expertise_areas;
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error('expertiseAreas must contain at least one item');
    }
    return true;
  }),
  body('qualifications').optional().isArray().withMessage('qualifications must be an array'),
  body('experienceYears').optional().isInt({ min: 0 }).withMessage('experienceYears must be a positive integer'),
  body('experience_years').optional().isInt({ min: 0 }).withMessage('experience_years must be a positive integer'),
  body('availabilityHours').optional().isArray().withMessage('availabilityHours must be an array'),
  body('availability_hours').optional().isArray().withMessage('availability_hours must be an array'),
  body('consultationFee').optional().isFloat({ min: 0 }).withMessage('consultationFee must be a positive number'),
  body('consultation_fee').optional().isFloat({ min: 0 }).withMessage('consultation_fee must be a positive number'),
  body().custom((_, { req }) => {
    if (!req.body.licenseNumber && !req.body.license_number) {
      throw new Error('licenseNumber is required');
    }
    return true;
  })
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('loginAs')
    .optional()
    .isIn(['farmer', 'expert', 'admin'])
    .withMessage('loginAs must be one of farmer, expert, or admin')
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail()
];

const resetPasswordValidator = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('newPassword').custom((value) => {
    if (!isStrongPassword(value)) {
      throw new Error(passwordPolicyMessage);
    }
    return true;
  })
];

const verifyEmailValidator = [
  body('token').trim().notEmpty().withMessage('Verification token is required')
];

const refreshTokenValidator = [
  body('refreshToken').trim().notEmpty().withMessage('Refresh token is required')
];

const logoutValidator = [
  body('refreshToken').trim().notEmpty().withMessage('Refresh token is required')
];

const emailPreferencesValidator = [
  body('appointmentReminder').optional().isBoolean().withMessage('appointmentReminder must be boolean'),
  body('marketUpdates').optional().isBoolean().withMessage('marketUpdates must be boolean'),
  body('weatherAlerts').optional().isBoolean().withMessage('weatherAlerts must be boolean'),
  body('newsletter').optional().isBoolean().withMessage('newsletter must be boolean'),
  body('promotional').optional().isBoolean().withMessage('promotional must be boolean')
];

const unsubscribeValidator = [
  body('token').trim().notEmpty().withMessage('Unsubscribe token is required'),
  body('category')
    .optional()
    .isIn(['appointmentReminder', 'marketUpdates', 'weatherAlerts', 'newsletter', 'promotional'])
    .withMessage('Unsupported email category')
];

module.exports = {
  registerValidator,
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
};
