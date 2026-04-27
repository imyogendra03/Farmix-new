const jwt = require('jsonwebtoken');
const Appointment = require('./models/Appointment');
const User = require('./models/User');

const appointmentRoomName = (appointmentId) => `appointment:${appointmentId}`;

const configureSocketServer = (io) => {
  io.use(async (socket, next) => {
    try {
      const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization || '';
      const token = String(rawToken).replace(/^Bearer\s+/i, '').trim();

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password -refreshTokens');

      if (!user || !user.isActive || user.isBlocked) {
        return next(new Error('Not authorized'));
      }

      socket.user = user;
      return next();
    } catch (_error) {
      return next(new Error('Not authorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join:appointment', async ({ appointmentId }, callback = () => {}) => {
      try {
        if (!appointmentId) {
          callback({ success: false, message: 'appointmentId is required' });
          return;
        }

        const appointment = await Appointment.findById(appointmentId).select('farmerId expertId');
        if (!appointment) {
          callback({ success: false, message: 'Appointment not found' });
          return;
        }

        const userId = String(socket.user._id);
        const isParticipant =
          socket.user.role === 'admin' ||
          String(appointment.farmerId) === userId ||
          String(appointment.expertId) === userId;

        if (!isParticipant) {
          callback({ success: false, message: 'Not authorized for this appointment' });
          return;
        }

        socket.join(appointmentRoomName(appointmentId));
        callback({ success: true, room: appointmentRoomName(appointmentId) });
      } catch (_error) {
        callback({ success: false, message: 'Failed to join appointment room' });
      }
    });

    socket.on('leave:appointment', ({ appointmentId }) => {
      if (!appointmentId) {
        return;
      }

      socket.leave(appointmentRoomName(appointmentId));
    });
  });
};

module.exports = {
  configureSocketServer,
  appointmentRoomName
};
