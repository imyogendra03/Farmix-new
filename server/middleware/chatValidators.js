const { body, param } = require('express-validator');

const sendChatMessageValidator = [
  body('appointmentId').trim().notEmpty().withMessage('appointmentId is required'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('message is required')
    .isLength({ max: 2000 })
    .withMessage('message can be at most 2000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file'])
    .withMessage('messageType must be one of: text, image, file')
];

const chatAppointmentIdValidator = [
  param('appointmentId').trim().notEmpty().withMessage('appointmentId is required')
];

module.exports = {
  sendChatMessageValidator,
  chatAppointmentIdValidator
};
