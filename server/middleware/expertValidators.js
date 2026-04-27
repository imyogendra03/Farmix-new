const { body, param } = require('express-validator');

const timePattern = /^\d{2}:\d{2}$/;
const slotStatuses = ['available', 'blocked'];

const createExpertSlotsValidator = [
  body().custom((value = {}) => {
    const hasSlotsArray = Array.isArray(value.slots) && value.slots.length > 0;

    if (!hasSlotsArray && (!value.date || !value.startTime || !value.endTime)) {
      throw new Error('Provide either slots[] or date, startTime, and endTime');
    }

    return true;
  }),
  body('slots')
    .optional()
    .isArray({ min: 1 })
    .withMessage('slots must be a non-empty array'),
  body('slots.*.date')
    .optional()
    .isISO8601()
    .withMessage('slots date must be a valid ISO-8601 date'),
  body('slots.*.startTime')
    .optional()
    .matches(timePattern)
    .withMessage('slots startTime must be in HH:MM format'),
  body('slots.*.endTime')
    .optional()
    .matches(timePattern)
    .withMessage('slots endTime must be in HH:MM format'),
  body('slots.*.status')
    .optional()
    .isIn(slotStatuses)
    .withMessage(`slots status must be one of: ${slotStatuses.join(', ')}`),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('date must be a valid ISO-8601 date'),
  body('startTime')
    .optional()
    .matches(timePattern)
    .withMessage('startTime must be in HH:MM format'),
  body('endTime')
    .optional()
    .matches(timePattern)
    .withMessage('endTime must be in HH:MM format'),
  body('status')
    .optional()
    .isIn(slotStatuses)
    .withMessage(`status must be one of: ${slotStatuses.join(', ')}`)
];

const expertSlotsQueryValidator = [
  param('expertId').trim().notEmpty().withMessage('expertId is required')
];

module.exports = {
  createExpertSlotsValidator,
  expertSlotsQueryValidator
};
