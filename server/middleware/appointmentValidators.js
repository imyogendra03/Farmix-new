const { body, param } = require('express-validator');

const consultationTypes = ['chat', 'call', 'video'];

const bookAppointmentValidator = [
  body('expertId').trim().notEmpty().withMessage('expertId is required'),
  body('date').isISO8601().withMessage('date must be a valid ISO-8601 date'),
  body().custom((value = {}) => {
    const slot = value.timeSlot || value.slot;

    if (!slot || typeof slot !== 'string' || !slot.trim()) {
      throw new Error('slot is required');
    }

    return true;
  }),
  body('consultationType')
    .optional()
    .isIn(consultationTypes)
    .withMessage(`consultationType must be one of: ${consultationTypes.join(', ')}`),
  body('queryDescription')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('queryDescription can be at most 1000 characters'),
  body('cropType')
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage('cropType can be at most 80 characters')
];

const appointmentIdValidator = [
  param('id').trim().notEmpty().withMessage('appointment id is required')
];

const declineAppointmentValidator = [
  ...appointmentIdValidator,
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('reason can be at most 300 characters')
];

const cancelAppointmentValidator = [
  ...appointmentIdValidator,
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('reason can be at most 300 characters')
];

const appointmentConclusionValidator = [
  body('appointmentId').trim().notEmpty().withMessage('appointmentId is required'),
  body('diagnosis')
    .trim()
    .notEmpty()
    .withMessage('diagnosis is required')
    .isLength({ max: 2000 })
    .withMessage('diagnosis can be at most 2000 characters'),
  body('recommendation')
    .trim()
    .notEmpty()
    .withMessage('recommendation is required')
    .isLength({ max: 3000 })
    .withMessage('recommendation can be at most 3000 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage('notes can be at most 3000 characters')
];

module.exports = {
  bookAppointmentValidator,
  appointmentIdValidator,
  declineAppointmentValidator,
  cancelAppointmentValidator,
  appointmentConclusionValidator
};
