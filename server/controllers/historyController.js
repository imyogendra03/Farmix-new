const CropData = require('../models/CropData');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Chat = require('../models/Chat');

const asPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const asNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const getPagination = (req) => {
  const page = asPositiveInt(req.query.page, 1);
  const limit = asPositiveInt(req.query.limit, 20);
  return { page, limit, skip: (page - 1) * limit };
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const applyDateRange = (query, field, fromValue, toValue) => {
  const from = parseDate(fromValue);
  const to = parseDate(toValue);
  if (!from && !to) return;

  query[field] = query[field] || {};
  if (from) query[field].$gte = from;
  if (to) query[field].$lte = to;
};

const parseList = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  const items = text.split(',').map((item) => item.trim()).filter(Boolean);
  return items.length ? items : null;
};

// @desc    Get all prediction history for a user
// @route   GET /api/predictions/history
// @access  Private
const getPredictionHistory = async (req, res, next) => {
  try {
    const history = await CropData.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat history
// @route   GET /api/history/chat
// @access  Private
const getChatHistory = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const appointmentFilter = req.query.appointmentId || req.query.appointment_id;
    const mode = String(req.query.mode || '').trim().toLowerCase();
    const query = {};

    if (req.user.role === 'farmer' || req.user.role === 'expert') {
      const appointmentScopeQuery = req.user.role === 'farmer'
        ? { farmerId: req.user.id }
        : { expertId: req.user.id };

      if (appointmentFilter) {
        appointmentScopeQuery._id = appointmentFilter;
      }

      const allowedAppointments = await Appointment.find(appointmentScopeQuery)
        .select('_id')
        .lean();

      query.appointmentId = { $in: allowedAppointments.map((appointment) => appointment._id) };
    } else if (appointmentFilter) {
      query.appointmentId = appointmentFilter;
    }

    applyDateRange(query, 'createdAt', req.query.from, req.query.to);

    if (mode === 'conversations') {
      const [items, countPayload] = await Promise.all([
        Chat.aggregate([
          { $match: query },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: '$appointmentId',
              count: { $sum: 1 },
              lastMessage: { $first: '$$ROOT' }
            }
          },
          { $sort: { 'lastMessage.createdAt': -1 } },
          { $skip: skip },
          { $limit: limit }
        ]),
        Chat.aggregate([
          { $match: query },
          { $group: { _id: '$appointmentId' } },
          { $count: 'total' }
        ])
      ]);

      const total = countPayload?.[0]?.total || 0;
      const appointmentIds = items.map((item) => item._id).filter(Boolean);
      const appointments = appointmentIds.length
        ? await Appointment.find({ _id: { $in: appointmentIds } })
            .populate('farmerId', 'name email')
            .populate('expertId', 'name email')
            .select('farmerId expertId status appointmentDetails createdAt')
            .lean()
        : [];

      const appointmentById = appointments.reduce((acc, appointment) => {
        acc.set(String(appointment._id), appointment);
        return acc;
      }, new Map());

      const payload = items.map((item) => ({
        appointmentId: item._id,
        count: item.count,
        lastMessage: item.lastMessage
          ? {
              _id: item.lastMessage._id,
              appointmentId: item.lastMessage.appointmentId,
              senderId: item.lastMessage.senderId,
              senderRole: item.lastMessage.senderRole,
              message: item.lastMessage.message,
              messageType: item.lastMessage.messageType,
              createdAt: item.lastMessage.createdAt
            }
          : null,
        appointment: appointmentById.get(String(item._id)) || null
      }));

      return res.json({
        success: true,
        data: payload,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });
    }

    const chats = await Chat.find(query)
      .populate({
        path: 'appointmentId',
        select: 'farmerId expertId status appointmentDetails',
        populate: [
          { path: 'farmerId', select: 'name email' },
          { path: 'expertId', select: 'name email' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Chat.countDocuments(query);

    return res.json({
      success: true,
      data: chats,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointment history
// @route   GET /api/history/appointments
// @access  Private
const getAppointmentHistory = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const farmerFilter = req.query.farmerId || req.query.farmer_id;
    const expertFilter = req.query.expertId || req.query.expert_id;
    const statusFilter = req.query.status || req.query.statuses;
    const query = {};

    if (req.user.role === 'farmer') {
      query.farmerId = req.user.id;
    } else if (req.user.role === 'expert') {
      query.expertId = req.user.id;
    } else {
      if (farmerFilter) query.farmerId = farmerFilter;
      if (expertFilter) query.expertId = expertFilter;
    }

    const statuses = parseList(statusFilter);
    if (statuses) {
      query.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }

    applyDateRange(query, 'appointmentDetails.date', req.query.dateFrom || req.query.from, req.query.dateTo || req.query.to);

    const appointments = await Appointment.find(query)
      .populate('farmerId', 'name email')
      .populate('expertId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(query);
    res.json({
      success: true,
      data: appointments,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get review history
// @route   GET /api/history/reviews
// @access  Private
const getReviewHistory = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const farmerFilter = req.query.farmerId || req.query.farmer_id;
    const expertFilter = req.query.expertId || req.query.expert_id;
    const appointmentFilter = req.query.appointmentId || req.query.appointment_id;
    const moderationStatus = req.query.moderationStatus || req.query.moderation_status;
    const ratingMin = asNumber(req.query.ratingMin || req.query.rating_min);
    const ratingMax = asNumber(req.query.ratingMax || req.query.rating_max);
    const query = {};

    if (req.user.role === 'farmer') {
      query.farmerId = req.user.id;
    } else if (req.user.role === 'expert') {
      query.expertId = req.user.id;
    } else {
      if (farmerFilter) query.farmerId = farmerFilter;
      if (expertFilter) query.expertId = expertFilter;
    }

    if (appointmentFilter) {
      query.appointmentId = appointmentFilter;
    }

    if (moderationStatus) {
      query['moderation.status'] = moderationStatus;
    }

    if (ratingMin !== null || ratingMax !== null) {
      query.rating = {};
      if (ratingMin !== null) query.rating.$gte = ratingMin;
      if (ratingMax !== null) query.rating.$lte = ratingMax;
    }

    applyDateRange(query, 'createdAt', req.query.from, req.query.to);

    const reviews = await Review.find(query)
      .populate('farmerId', 'name email')
      .populate('expertId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(query);
    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get call history
// @route   GET /api/history/calls
// @access  Private
const getCallHistory = async (_req, res) => {
  // Call logs model is not implemented yet in this codebase.
  res.json({
    success: true,
    data: [],
    message: 'Call history model is not configured yet'
  });
};

module.exports = {
  getPredictionHistory,
  getChatHistory,
  getAppointmentHistory,
  getReviewHistory,
  getCallHistory
};
