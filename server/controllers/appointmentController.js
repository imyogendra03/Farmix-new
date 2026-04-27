const crypto = require('crypto');
const Appointment = require('../models/Appointment');
const Chat = require('../models/Chat');
const Expert = require('../models/Expert');
const ExpertSlot = require('../models/ExpertSlot');
const User = require('../models/User');
const emailService = require('../services/emailService');

const ACTIVE_BOOKING_STATUSES = ['pending', 'accepted', 'active', 'confirmed'];

const getDateRangeForDay = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { date, start, end };
};

const resolveExpertProfile = async (expertId) => {
  const expertByProfile = await Expert.findById(expertId).populate('userId', 'name email');
  if (expertByProfile) {
    return expertByProfile;
  }

  return Expert.findOne({ userId: expertId }).populate('userId', 'name email');
};

// Book appointment
const bookAppointment = async (req, res, next) => {
  try {
    const {
      farmerId,
      expertId,
      date,
      timeSlot,
      slot,
      consultationType,
      queryDescription,
      cropType
    } = req.body;
    const normalizedSlot = String(timeSlot || slot || '').trim();

    if (!expertId || !date || !normalizedSlot) {
      res.status(400);
      throw new Error('farmerId, expertId, date, and slot are required');
    }

    if (!['farmer', 'admin'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Only farmers can book appointments');
    }

    const bookingFarmerId = req.user.role === 'admin' ? farmerId : req.user.id;
    if (!bookingFarmerId) {
      res.status(400);
      throw new Error('farmerId is required');
    }

    const dayRange = getDateRangeForDay(date);
    if (!dayRange) {
      res.status(400);
      throw new Error('Invalid appointment date');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (dayRange.start < todayStart) {
      res.status(400);
      throw new Error('Appointment date cannot be in the past');
    }

    // Verify expert exists and is approved
    const expert = await resolveExpertProfile(expertId);
    if (!expert || !expert.userId || expert.verification.status !== 'approved') {
      res.status(400);
      throw new Error('Expert not available');
    }

    if (expert.status?.isSuspended || expert.status?.isActive === false) {
      res.status(400);
      throw new Error('Expert account is currently not available');
    }

    const farmer = await User.findById(bookingFarmerId);
    if (!farmer || farmer.role !== 'farmer') {
      res.status(400);
      throw new Error('Valid farmer not found');
    }

    if (req.user.role === 'farmer') {
      const followsExpert = (farmer.followingExperts || []).some(
        (item) => String(item) === String(expert.userId._id)
      );

      if (!followsExpert) {
        res.status(403);
        throw new Error('Follow the expert before booking an appointment');
      }
    }

    // Check slot availability for requested day if expert defined a weekly schedule.
    const dayName = dayRange.date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (Array.isArray(expert.consultation?.availableSlots) && expert.consultation.availableSlots.length > 0) {
      const hasDayAvailability = expert.consultation.availableSlots.some((slot) => {
        if (!slot || !slot.day) return false;
        return String(slot.day).toLowerCase() === dayName;
      });

      if (!hasDayAvailability) {
        res.status(400);
        throw new Error('Expert is not available on the selected date');
      }
    }

    const slotRecord = await ExpertSlot.findOne({
      expertId: expert.userId._id,
      date: {
        $gte: dayRange.start,
        $lt: dayRange.end
      },
      startTime: normalizedSlot
    });

    if (slotRecord && slotRecord.status !== 'available') {
      res.status(400);
      throw new Error('This slot is already booked');
    }

    // Check slot conflicts
    const existingBooking = await Appointment.findOne({
      expertId: expert.userId._id,
      'appointmentDetails.date': {
        $gte: dayRange.start,
        $lt: dayRange.end
      },
      'appointmentDetails.startTime': normalizedSlot,
      status: { $in: ACTIVE_BOOKING_STATUSES }
    });

    if (existingBooking) {
      res.status(400);
      throw new Error('This time slot is already booked');
    }

    const duplicateBooking = await Appointment.findOne({
      farmerId: bookingFarmerId,
      expertId: expert.userId._id,
      'appointmentDetails.date': {
        $gte: dayRange.start,
        $lt: dayRange.end
      },
      'appointmentDetails.startTime': normalizedSlot,
      status: { $in: ACTIVE_BOOKING_STATUSES }
    });

    if (duplicateBooking) {
      res.status(409);
      throw new Error('Duplicate booking is not allowed for the same farmer and slot');
    }

    const confirmationToken = crypto.randomBytes(12).toString('hex');

    const appointment = await Appointment.create({
      farmerId: bookingFarmerId,
      expertId: expert.userId._id,
      confirmationToken,
      appointmentDetails: {
        date: dayRange.date,
        startTime: normalizedSlot,
        consultationType: consultationType || 'chat',
        queryDescription: queryDescription || '',
        cropType: cropType || ''
      },
      status: 'pending',
      payment: {
        amount: expert.consultation.fee,
        status: expert.consultation.fee > 0 ? 'pending' : 'na'
      }
    });

    if (slotRecord) {
      slotRecord.status = 'booked';
      slotRecord.appointmentId = appointment._id;
      await slotRecord.save();
    }

    // Send notifications asynchronously.
    if (farmer) {
      emailService.sendAppointmentBooked(farmer, expert.userId, appointment).catch(console.error);
    }
    emailService.sendAppointmentRequestToExpert(expert.userId, farmer, appointment).catch(console.error);

    res.status(201).json({
      success: true,
      data: {
        appointmentId: appointment._id,
        confirmationToken: appointment.confirmationToken,
        farmerId: appointment.farmerId,
        expertId: appointment.expertId,
        date: appointment.appointmentDetails.date,
        slot: appointment.appointmentDetails.startTime,
        time: appointment.appointmentDetails.startTime,
        expertName: expert.userId.name,
        consultationFee: appointment.payment.amount,
        status: appointment.status
      },
      message: 'Appointment booked successfully. Expert will confirm within 2 hours.'
    });
  } catch (error) {
    next(error);
  }
};

// Get appointments (for farmer or expert)
const getAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'farmer') {
      query.farmerId = req.user.id;
    } else if (req.user.role === 'expert') {
      query.expertId = req.user.id;
    } else {
      // admin sees all
    }

    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate('farmerId', 'name email phone profilePhoto address')
      .populate('expertId', 'name email phone profilePhoto')
      .select('_id farmerId expertId appointmentDetails status expertResponse payment consultation conclusion cancellation review remindersSent createdAt updatedAt')
      .sort({ 'appointmentDetails.date': -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: appointments,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const submitAppointmentConclusion = async (req, res, next) => {
  try {
    const { appointmentId, diagnosis, recommendation, notes } = req.body;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    if (req.user.role !== 'expert') {
      res.status(403);
      throw new Error('Only expert can submit conclusion');
    }

    if (appointment.expertId.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized');
    }

    if (!['accepted', 'active', 'confirmed'].includes(appointment.status)) {
      res.status(400);
      throw new Error('Conclusion can only be submitted for an accepted or active appointment');
    }

    appointment.conclusion = {
      diagnosis,
      recommendation,
      notes: notes || '',
      submittedBy: req.user.id,
      submittedAt: new Date()
    };

    await appointment.save();

    res.status(201).json({
      success: true,
      data: appointment.conclusion,
      message: 'Appointment conclusion submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Accept appointment (expert)
const acceptAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    if (req.user.role !== 'expert') {
      res.status(403);
      throw new Error('Only expert can accept appointments');
    }

    if (appointment.expertId.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized');
    }

    if (appointment.status !== 'pending') {
      res.status(400);
      throw new Error('Only pending appointments can be accepted');
    }

    appointment.status = 'accepted';
    appointment.expertResponse.responseStatus = 'accepted';
    appointment.expertResponse.responseAt = new Date();
    await appointment.save();

    const [farmer, expert] = await Promise.all([
      User.findById(appointment.farmerId),
      User.findById(appointment.expertId)
    ]);
    if (farmer && expert) {
      emailService.sendAppointmentConfirmed(farmer, expert, appointment).catch(console.error);
    }

    res.json({ success: true, data: appointment, message: 'Appointment accepted!' });
  } catch (error) {
    next(error);
  }
};

// Reject appointment (expert)
const rejectAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    if (req.user.role !== 'expert') {
      res.status(403);
      throw new Error('Only expert can reject appointments');
    }

    if (appointment.expertId.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized');
    }

    if (appointment.status !== 'pending') {
      res.status(400);
      throw new Error('Only pending appointments can be rejected');
    }

    appointment.status = 'rejected';
    appointment.expertResponse.responseStatus = 'declined';
    appointment.expertResponse.responseAt = new Date();
    appointment.expertResponse.declineReason = req.body.reason || '';
    appointment.cancellation = {
      cancelledBy: 'expert',
      cancelledAt: new Date(),
      reason: req.body.reason || 'Expert rejected'
    };
    await appointment.save();

    const slotRange = getDateRangeForDay(appointment.appointmentDetails.date);
    if (slotRange) {
      const slotRecord = await ExpertSlot.findOne({
        expertId: appointment.expertId,
        date: {
          $gte: slotRange.start,
          $lt: slotRange.end
        },
        startTime: appointment.appointmentDetails.startTime
      });

      if (slotRecord) {
        slotRecord.status = 'available';
        slotRecord.appointmentId = null;
        await slotRecord.save();
      }
    }

    res.json({ success: true, data: appointment, message: 'Appointment rejected' });
  } catch (error) {
    next(error);
  }
};

const declineAppointment = rejectAppointment;

// Cancel appointment (farmer)
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    if (appointment.farmerId.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized');
    }

    if (!ACTIVE_BOOKING_STATUSES.includes(appointment.status)) {
      res.status(400);
      throw new Error('Only active appointments can be cancelled');
    }

    appointment.status = 'cancelled';
    appointment.cancellation = {
      cancelledBy: req.user.role === 'admin' ? 'system' : 'farmer',
      cancelledAt: new Date(),
      reason: req.body.reason || 'Cancelled by user'
    };
    await appointment.save();

    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (error) {
    next(error);
  }
};

// Complete appointment
const completeAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    if (req.user.role !== 'expert') {
      res.status(403);
      throw new Error('Only expert can complete appointment');
    }

    if (appointment.expertId.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized');
    }

    if (!['active', 'accepted', 'confirmed'].includes(appointment.status)) {
      res.status(400);
      throw new Error('Only active appointments can be completed');
    }

    const expertFirstMessage = await Chat.findOne({
      appointmentId: appointment._id,
      senderRole: 'expert'
    }).lean();

    if (!expertFirstMessage) {
      res.status(400);
      throw new Error('Cannot complete appointment without expert messages');
    }

    if (!appointment.conclusion?.diagnosis || !appointment.conclusion?.recommendation) {
      res.status(400);
      throw new Error('Cannot complete appointment without conclusion');
    }

    appointment.status = 'completed';
    appointment.consultation.endTime = new Date();
    if (appointment.consultation.startTime) {
      appointment.consultation.actualDuration = Math.round(
        (new Date() - appointment.consultation.startTime) / 60000
      );
    }
    await appointment.save();

    // Update expert stats
    await Expert.findOneAndUpdate(
      { userId: appointment.expertId },
      {
        $inc: {
          'performance.totalConsultations': 1,
          'performance.completedConsultations': 1
        }
      }
    );

    res.json({ success: true, data: appointment, message: 'Consultation completed!' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  getAppointments,
  acceptAppointment,
  rejectAppointment,
  declineAppointment,
  cancelAppointment,
  completeAppointment,
  submitAppointmentConclusion
};
