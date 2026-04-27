const Review = require('../models/Review');
const Expert = require('../models/Expert');
const Appointment = require('../models/Appointment');

// Submit review
const submitReview = async (req, res, next) => {
  try {
    const { appointmentId, expertId, rating, feedback, categoryRatings, wouldRecommend } = req.body;

    if (req.user.role !== 'farmer') {
      res.status(403);
      throw new Error('Only farmer can submit review');
    }

    if (!expertId || !rating || !feedback) {
      res.status(400);
      throw new Error('Expert, rating, and feedback are required');
    }

    if (feedback.length < 10) {
      res.status(400);
      throw new Error('Feedback must be at least 10 characters');
    }

    if (!appointmentId) {
      res.status(400);
      throw new Error('appointmentId is required');
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    if (appointment.farmerId.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to review this appointment');
    }

    if (appointment.expertId.toString() !== String(expertId)) {
      res.status(400);
      throw new Error('Appointment expert does not match review expert');
    }

    if (appointment.status !== 'completed') {
      res.status(400);
      throw new Error('Review can only be submitted after appointment completion');
    }

    // Check for duplicate review
    const existing = await Review.findOne({ farmerId: req.user.id, expertId });
    if (existing && appointmentId) {
      const existingForAppt = await Review.findOne({ farmerId: req.user.id, appointmentId });
      if (existingForAppt) {
        res.status(400);
        throw new Error('You have already reviewed this consultation');
      }
    }

    const review = await Review.create({
      appointmentId: appointmentId || null,
      farmerId: req.user.id,
      expertId,
      rating,
      feedback,
      categoryRatings: categoryRatings || { expertise: rating, communication: rating, timeliness: rating },
      wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true,
      moderation: { status: 'pending', isVisible: false }
    });

    // Update appointment if linked
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        'review.reviewed': true,
        'review.reviewId': review._id,
        'review.rating': rating,
        'review.feedback': feedback
      });
    }

    res.status(201).json({
      success: true,
      data: review,
      message: 'Thank you for your feedback! Admin will review it shortly.'
    });
  } catch (error) {
    next(error);
  }
};

// Get approved reviews (public - for homepage & expert profiles)
const getApprovedReviews = async (req, res, next) => {
  try {
    const { expertId, limit = 20, page = 1 } = req.query;
    const query = { 'moderation.status': 'approved', 'moderation.isVisible': true };

    if (expertId) query.expertId = expertId;

    const reviews = await Review.find(query)
      .populate('farmerId', 'name profilePhoto')
      .populate('expertId', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      data: reviews,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// Get my reviews (farmer)
const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ farmerId: req.user.id })
      .populate('expertId', 'name profilePhoto')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitReview, getApprovedReviews, getMyReviews };
