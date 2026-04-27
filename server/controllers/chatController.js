const Appointment = require('../models/Appointment');
const Chat = require('../models/Chat');
const { appointmentRoomName } = require('../socket');

const ensureAppointmentParticipant = (appointment, user) => {
  if (!appointment || !user) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  const userId = String(user.id || user._id);
  return String(appointment.farmerId) === userId || String(appointment.expertId) === userId;
};

const sendChatMessage = async (req, res, next) => {
  try {
    const { appointmentId, message, messageType, attachments } = req.body;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    if (!ensureAppointmentParticipant(appointment, req.user)) {
      res.status(403);
      throw new Error('Not authorized to send messages for this appointment');
    }

    const firstMessage = await Chat.findOne({ appointmentId })
      .sort({ createdAt: 1 })
      .lean();

    if (!firstMessage && req.user.role !== 'expert') {
      res.status(403);
      throw new Error('Expert must send the first message for this appointment');
    }

    if (!firstMessage && req.user.role === 'expert' && ['accepted', 'confirmed'].includes(appointment.status)) {
      appointment.status = 'active';
      if (!appointment.consultation.startTime) {
        appointment.consultation.startTime = new Date();
      }
      await appointment.save();
    }

    const chatMessage = await Chat.create({
      appointmentId,
      senderId: req.user.id,
      senderRole: req.user.role,
      message,
      messageType: messageType || 'text',
      attachments: Array.isArray(attachments) ? attachments : [],
      readBy: [
        {
          userId: req.user.id,
          readAt: new Date()
        }
      ]
    });

    const io = req.app?.get ? req.app.get('io') : null;
    if (io) {
      io.to(appointmentRoomName(appointmentId)).emit('chat:message', chatMessage);
    }

    res.status(201).json({
      success: true,
      data: {
        ...(chatMessage.toObject ? chatMessage.toObject() : chatMessage),
        appointmentStatus: appointment.status
      },
      message: 'Message sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getChatMessages = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    if (!ensureAppointmentParticipant(appointment, req.user)) {
      res.status(403);
      throw new Error('Not authorized to view messages for this appointment');
    }

    const messages = await Chat.find({ appointmentId })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendChatMessage,
  getChatMessages
};
