const express = require('express');
const router = express.Router();
const { protect, expert, farmer } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateRequest');
const {
  bookAppointmentValidator,
  appointmentIdValidator,
  declineAppointmentValidator,
  cancelAppointmentValidator,
  appointmentConclusionValidator
} = require('../middleware/appointmentValidators');
const {
  bookAppointment,
  getAppointments,
  acceptAppointment,
  rejectAppointment,
  declineAppointment,
  cancelAppointment,
  completeAppointment,
  submitAppointmentConclusion
} = require('../controllers/appointmentController');

router.post('/book', protect, farmer, bookAppointmentValidator, validate, bookAppointment);
router.post('/', protect, farmer, bookAppointmentValidator, validate, bookAppointment);
router.get('/', protect, getAppointments);
router.put('/:id/accept', protect, expert, appointmentIdValidator, validate, acceptAppointment);
router.put('/:id/reject', protect, expert, declineAppointmentValidator, validate, rejectAppointment);
router.put('/:id/decline', protect, expert, declineAppointmentValidator, validate, declineAppointment);
router.put('/:id/cancel', protect, cancelAppointmentValidator, validate, cancelAppointment);
router.put('/:id/complete', protect, expert, appointmentIdValidator, validate, completeAppointment);
router.post('/conclusion', protect, expert, appointmentConclusionValidator, validate, submitAppointmentConclusion);

module.exports = router;
