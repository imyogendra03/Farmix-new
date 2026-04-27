const Expert = require('../models/Expert');
const User = require('../models/User');
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const ExpertSlot = require('../models/ExpertSlot');

const ACTIVE_APPOINTMENT_STATUSES = ['pending', 'accepted', 'active', 'confirmed'];

const getDateRangeForDay = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { date: start, start, end };
};

const toMinutes = (value) => {
  const [hours, minutes] = String(value).split(':').map(Number);
  return (hours * 60) + minutes;
};

const slotsOverlap = (left, right) =>
  toMinutes(left.startTime) < toMinutes(right.endTime) &&
  toMinutes(right.startTime) < toMinutes(left.endTime);

const normalizeSlotInput = (payload = {}) => {
  const sourceSlots = Array.isArray(payload.slots) && payload.slots.length > 0
    ? payload.slots
    : [payload];

  return sourceSlots.map((slot) => ({
    date: slot.date,
    startTime: String(slot.startTime || '').trim(),
    endTime: String(slot.endTime || '').trim(),
    status: slot.status || 'available',
    notes: slot.notes || ''
  }));
};

const resolveExpertProfile = async (expertId) => {
  const expertByProfile = await Expert.findById(expertId);
  if (expertByProfile) {
    return expertByProfile;
  }

  return Expert.findOne({ userId: expertId });
};

const getAvailableExperts = async (req, res, next) => {
  try {
    const { crop, issue, date, page = 1, limit = 20 } = req.query;
    const query = {
      'verification.status': 'approved',
      'status.isSuspended': { $ne: true }
    };

    if (issue || crop) {
      const searchTerms = [issue, crop].filter(Boolean).map((term) => new RegExp(term, 'i'));
      query['professionalInfo.expertiseAreas'] = { $in: searchTerms };
    }

    const experts = await Expert.find(query)
      .populate('userId', 'name email phone profilePhoto address')
      .select('userId professionalInfo.expertiseAreas professionalInfo.experienceYears consultation.fee consultation.availableSlots consultation.consultationTypes ratings.averageRating status verification createdAt')
      .sort({ 'ratings.averageRating': -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    let bookedByExpertUserId = new Map();
    if (date) {
      const range = getDateRangeForDay(date);
      if (range) {
        const appointments = await Appointment.find({
          'appointmentDetails.date': { $gte: range.start, $lt: range.end },
          status: { $in: ACTIVE_APPOINTMENT_STATUSES }
        })
          .select('expertId appointmentDetails.startTime')
          .lean();

        bookedByExpertUserId = appointments.reduce((acc, item) => {
          const key = String(item.expertId);
          const list = acc.get(key) || [];
          list.push(item.appointmentDetails.startTime);
          acc.set(key, list);
          return acc;
        }, new Map());
      }
    }

    const payload = experts.map((expert) => {
      const userId = expert.userId;
      const bookedTimes = bookedByExpertUserId.get(String(userId?._id)) || [];

      return {
        id: expert._id,
        userId: userId?._id,
        name: userId?.name,
        expertise: expert.professionalInfo?.expertiseAreas || [],
        rating: expert.ratings?.averageRating || 0,
        experienceYears: expert.professionalInfo?.experienceYears || 0,
        consultationFee: expert.consultation?.fee || 0,
        availability: expert.consultation?.availableSlots || [],
        bookedTimes,
        consultationTypes: expert.consultation?.consultationTypes || ['chat']
      };
    });

    const total = await Expert.countDocuments(query);
    res.json({
      success: true,
      data: payload,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getFollowedExperts = async (req, res, next) => {
  try {
    if (req.user.role !== 'farmer') {
      res.status(403);
      throw new Error('Only farmers can access followed experts');
    }

    const farmer = await User.findById(req.user.id).select('followingExperts').lean();
    const followingExperts = (farmer?.followingExperts || []).map((item) => String(item));

    if (followingExperts.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const experts = await Expert.find({
      userId: { $in: followingExperts },
      'verification.status': 'approved',
      'status.isSuspended': { $ne: true }
    })
      .populate('userId', 'name email phone profilePhoto address')
      .select('userId professionalInfo.expertiseAreas professionalInfo.experienceYears consultation.fee consultation.availableSlots consultation.consultationTypes ratings.averageRating')
      .sort({ 'ratings.averageRating': -1, createdAt: -1 })
      .lean();

    const payload = experts.map((expert) => ({
      id: expert._id,
      userId: expert.userId?._id,
      name: expert.userId?.name,
      expertise: expert.professionalInfo?.expertiseAreas || [],
      rating: expert.ratings?.averageRating || 0,
      experienceYears: expert.professionalInfo?.experienceYears || 0,
      consultationFee: expert.consultation?.fee || 0,
      availability: expert.consultation?.availableSlots || [],
      consultationTypes: expert.consultation?.consultationTypes || ['chat'],
      isFollowed: true
    }));

    res.json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
};

const followExpert = async (req, res, next) => {
  try {
    if (req.user.role !== 'farmer') {
      res.status(403);
      throw new Error('Only farmers can follow experts');
    }

    const expert = await resolveExpertProfile(req.params.id);
    if (!expert || expert.verification?.status !== 'approved') {
      res.status(404);
      throw new Error('Expert not found');
    }

    if (expert.status?.isSuspended || expert.status?.isActive === false) {
      res.status(400);
      throw new Error('Expert is currently unavailable');
    }

    const farmer = await User.findById(req.user.id);
    if (!farmer || farmer.role !== 'farmer') {
      res.status(404);
      throw new Error('Farmer not found');
    }

    const expertUserId = String(expert.userId);
    const alreadyFollowing = (farmer.followingExperts || []).some(
      (item) => String(item) === expertUserId
    );

    if (!alreadyFollowing) {
      farmer.followingExperts = [...(farmer.followingExperts || []), expert.userId];
      await farmer.save({ validateBeforeSave: false });
    }

    res.json({
      success: true,
      data: {
        expertId: expert._id,
        expertUserId: expert.userId,
        followed: true
      },
      message: 'Expert followed successfully'
    });
  } catch (error) {
    next(error);
  }
};

const unfollowExpert = async (req, res, next) => {
  try {
    if (req.user.role !== 'farmer') {
      res.status(403);
      throw new Error('Only farmers can unfollow experts');
    }

    const expert = await resolveExpertProfile(req.params.id);
    if (!expert) {
      res.status(404);
      throw new Error('Expert not found');
    }

    const farmer = await User.findById(req.user.id);
    if (!farmer || farmer.role !== 'farmer') {
      res.status(404);
      throw new Error('Farmer not found');
    }

    farmer.followingExperts = (farmer.followingExperts || []).filter(
      (item) => String(item) !== String(expert.userId)
    );
    await farmer.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: {
        expertId: expert._id,
        expertUserId: expert.userId,
        followed: false
      },
      message: 'Expert unfollowed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get all approved experts (public)
const getExperts = async (req, res, next) => {
  try {
    const { expertise, search, sort, page = 1, limit = 12 } = req.query;

    const query = { 'verification.status': 'approved' };

    if (expertise) {
      query['professionalInfo.expertiseAreas'] = { $in: [new RegExp(expertise, 'i')] };
    }

    let experts = await Expert.find(query)
      .populate('userId', 'name email phone profilePhoto address')
      .select('userId professionalInfo.expertiseAreas professionalInfo.experienceYears consultation.fee consultation.availableSlots consultation.consultationTypes ratings.averageRating verification createdAt')
      .sort(sort === 'rating' ? { 'ratings.averageRating': -1 } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    if (search) {
      const users = await User.find({
        role: 'expert',
        name: { $regex: search, $options: 'i' }
      }).select('_id').lean();
      const userIds = users.map(u => u._id);
      experts = experts.filter(e => userIds.some(id => id.equals(e.userId._id)));
    }

    const total = await Expert.countDocuments(query);

    res.json({
      success: true,
      data: experts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single expert details (public)
const getExpertById = async (req, res, next) => {
  try {
    const expert = await Expert.findById(req.params.id)
      .populate('userId', 'name email phone profilePhoto bio address')
      .select('userId professionalInfo consultation ratings performance earnings verification status createdAt')
      .lean();

    if (!expert) {
      res.status(404);
      throw new Error('Expert not found');
    }

    const reviews = await Review.find({
      expertId: expert.userId._id,
      'moderation.status': 'approved'
    })
      .populate('farmerId', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: { ...expert, reviews }
    });
  } catch (error) {
    next(error);
  }
};

// Get expert dashboard (expert only)
const getExpertDashboard = async (req, res, next) => {
  try {
    const expert = await Expert.findOne({ userId: req.user.id });
    if (!expert) {
      res.status(404);
      throw new Error('Expert profile not found');
    }

    const Appointment = require('../models/Appointment');

    const pendingAppointments = await Appointment.find({
      expertId: req.user.id,
      status: { $in: ['pending', 'accepted', 'active', 'confirmed'] }
    })
      .populate('farmerId', 'name email phone profilePhoto address')
      .select('_id farmerId appointmentDetails status expertResponse consultation conclusion createdAt')
      .sort({ 'appointmentDetails.date': 1 })
      .limit(20)
      .lean();

    const completedCount = await Appointment.countDocuments({
      expertId: req.user.id,
      status: 'completed'
    });

    const recentReviews = await Review.find({
      expertId: req.user.id,
      'moderation.status': 'approved'
    }).populate('farmerId', 'name profilePhoto').sort({ createdAt: -1 }).limit(5).lean();

    res.json({
      success: true,
      data: {
        expert,
        pendingAppointments,
        completedCount,
        recentReviews,
        stats: {
          totalConsultations: expert.performance.totalConsultations,
          completionRate: expert.performance.completionRate,
          averageRating: expert.ratings.averageRating,
          totalRatings: expert.ratings.totalRatings,
          earningsThisMonth: expert.earnings.earnedThisMonth
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getExpertFollowers = async (req, res, next) => {
  try {
    if (req.user.role !== 'expert') {
      res.status(403);
      throw new Error('Only experts can view follower data');
    }

    const followers = await User.find({
      role: 'farmer',
      followingExperts: req.user.id
    })
      .select('name email phone profilePhoto createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        totalFollowers: followers.length,
        followers
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update expert profile
const updateExpertProfile = async (req, res, next) => {
  try {
    const { consultation, professionalInfo } = req.body;
    const updateFields = {};

    if (consultation) {
      if (consultation.fee !== undefined) updateFields['consultation.fee'] = consultation.fee;
      if (consultation.consultationTypes) updateFields['consultation.consultationTypes'] = consultation.consultationTypes;
      if (consultation.availableSlots) updateFields['consultation.availableSlots'] = consultation.availableSlots;
      if (consultation.callNumber) updateFields['consultation.callNumber'] = consultation.callNumber;
    }
    if (professionalInfo) {
      if (professionalInfo.expertiseAreas) updateFields['professionalInfo.expertiseAreas'] = professionalInfo.expertiseAreas;
      if (professionalInfo.achievements) updateFields['professionalInfo.achievements'] = professionalInfo.achievements;
    }

    const expert = await Expert.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateFields },
      { new: true }
    );

    res.json({ success: true, data: expert });
  } catch (error) {
    next(error);
  }
};

const createExpertSlots = async (req, res, next) => {
  try {
    const expertProfile = await Expert.findOne({ userId: req.user.id });
    if (!expertProfile) {
      res.status(404);
      throw new Error('Expert profile not found');
    }

    const normalizedSlots = normalizeSlotInput(req.body);
    const preparedSlots = normalizedSlots.map((slot) => {
      const range = getDateRangeForDay(slot.date);
      if (!range) {
        const error = new Error('Invalid slot date');
        error.statusCode = 400;
        throw error;
      }

      if (toMinutes(slot.startTime) >= toMinutes(slot.endTime)) {
        const error = new Error('Slot endTime must be later than startTime');
        error.statusCode = 400;
        throw error;
      }

      return {
        expertId: req.user.id,
        date: range.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status,
        notes: slot.notes
      };
    });

    for (let index = 0; index < preparedSlots.length; index += 1) {
      for (let comparison = index + 1; comparison < preparedSlots.length; comparison += 1) {
        const current = preparedSlots[index];
        const other = preparedSlots[comparison];
        if (
          current.date.getTime() === other.date.getTime() &&
          slotsOverlap(current, other)
        ) {
          res.status(409);
          throw new Error('Overlapping slots are not allowed');
        }
      }
    }

    const existingSlots = await ExpertSlot.find({
      expertId: req.user.id,
      date: { $in: preparedSlots.map((slot) => slot.date) }
    });

    const hasExistingOverlap = preparedSlots.some((slot) =>
      existingSlots.some((existing) =>
        new Date(existing.date).getTime() === slot.date.getTime() &&
        slotsOverlap(slot, existing)
      )
    );

    if (hasExistingOverlap) {
      res.status(409);
      throw new Error('Requested slot overlaps with an existing slot');
    }

    const conflictingAppointments = await Appointment.find({
      expertId: req.user.id,
      'appointmentDetails.date': { $in: preparedSlots.map((slot) => slot.date) },
      status: { $in: ACTIVE_APPOINTMENT_STATUSES }
    }).select('appointmentDetails.date appointmentDetails.startTime');

    const hasBookedConflict = preparedSlots.some((slot) =>
      conflictingAppointments.some((appointment) =>
        new Date(appointment.appointmentDetails.date).getTime() === slot.date.getTime() &&
        appointment.appointmentDetails.startTime === slot.startTime
      )
    );

    if (hasBookedConflict) {
      res.status(409);
      throw new Error('Cannot create a slot that is already booked by an appointment');
    }

    const createdSlots = await ExpertSlot.insertMany(preparedSlots, { ordered: true });

    res.status(201).json({
      success: true,
      data: createdSlots,
      message: 'Expert slots created successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getExpertSlots = async (req, res, next) => {
  try {
    const expertProfile = await resolveExpertProfile(req.params.expertId);
    if (!expertProfile) {
      res.status(404);
      throw new Error('Expert not found');
    }

    const slotQuery = { expertId: expertProfile.userId };
    if (req.query.date) {
      const range = getDateRangeForDay(req.query.date);
      if (!range) {
        res.status(400);
        throw new Error('Invalid slot date');
      }
      slotQuery.date = { $gte: range.start, $lt: range.end };
    }

    const slots = await ExpertSlot.find(slotQuery)
      .sort({ date: 1, startTime: 1 })
      .lean();

    res.json({
      success: true,
      data: slots.map((slot) => ({
        ...slot,
        unavailable: slot.status !== 'available'
      }))
    });
  } catch (error) {
    next(error);
  }
};

// Get available slots for an expert
const getAvailableSlots = async (req, res, next) => {
  try {
    const expert = await resolveExpertProfile(req.params.id);
    if (!expert) {
      res.status(404);
      throw new Error('Expert not found');
    }

    const { date } = req.query;

    let dateQuery = { $gte: new Date() };
    if (date) {
      const range = getDateRangeForDay(date);
      if (range) {
        dateQuery = { $gte: range.start, $lt: range.end };
      }
    }

    const explicitSlots = await ExpertSlot.find({
      expertId: expert.userId,
      date: dateQuery
    }).sort({ date: 1, startTime: 1 }).lean();

    if (explicitSlots.length > 0) {
      return res.json({
        success: true,
        data: {
          availableSlots: explicitSlots.filter((slot) => slot.status === 'available'),
          bookedTimes: explicitSlots
            .filter((slot) => slot.status === 'booked')
            .map((slot) => slot.startTime),
          fee: expert.consultation.fee,
          consultationTypes: expert.consultation.consultationTypes,
          slots: explicitSlots.map((slot) => ({
            ...slot,
            unavailable: slot.status !== 'available'
          }))
        }
      });
    }

    const bookedSlots = await Appointment.find({
      expertId: expert.userId,
      'appointmentDetails.date': dateQuery,
      status: { $in: ACTIVE_APPOINTMENT_STATUSES }
    }).select('appointmentDetails.startTime');

    const bookedTimes = bookedSlots.map(a => a.appointmentDetails.startTime);

    res.json({
      success: true,
      data: {
        availableSlots: expert.consultation.availableSlots,
        bookedTimes,
        fee: expert.consultation.fee,
        consultationTypes: expert.consultation.consultationTypes
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableExperts,
  getFollowedExperts,
  followExpert,
  unfollowExpert,
  getExperts,
  getExpertById,
  getExpertDashboard,
  getExpertFollowers,
  updateExpertProfile,
  createExpertSlots,
  getExpertSlots,
  getAvailableSlots
};
