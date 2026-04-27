const User = require('../models/User');
const Expert = require('../models/Expert');
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const Contact = require('../models/Contact');
const AdminLog = require('../models/AdminLog');
const Post = require('../models/Post');
const emailService = require('../services/emailService');

const passwordPolicyMessage = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
const isStrongPassword = (value = '') => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);

// Helper: log admin action
const logAction = async (adminId, action, entityType, entityId, details = {}, req = null) => {
  try {
    await AdminLog.create({
      adminId,
      action,
      entityType,
      entityId,
      entityDetails: details,
      ipAddress: req?.ip || '',
      userAgent: req?.headers?.['user-agent'] || ''
    });
  } catch (e) {
    console.error('Admin log error:', e.message);
  }
};

// ─── DASHBOARD STATS ──────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const totalExperts = await User.countDocuments({ role: 'expert' });
    const pendingExperts = await Expert.countDocuments({ 'verification.status': 'pending' });
    const pendingReviews = await Review.countDocuments({ 'moderation.status': 'pending' });
    const totalAppointments = await Appointment.countDocuments();
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const totalContacts = await Contact.countDocuments({ status: 'new' });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: thisMonth } });
    const appointmentsThisMonth = await Appointment.countDocuments({ createdAt: { $gte: thisMonth } });

    res.json({
      success: true,
      data: {
        totalUsers: totalFarmers + totalExperts,
        totalFarmers,
        totalExperts,
        pendingExperts,
        pendingReviews,
        totalAppointments,
        completedAppointments,
        totalContacts,
        newUsersThisMonth,
        appointmentsThisMonth
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── USER MANAGEMENT ──────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (status === 'blocked') query.isBlocked = true;
    if (status === 'active') query.isBlocked = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -refreshTokens -verificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      isBlocked: true,
      blockReason: req.body.reason || 'Blocked by admin'
    }, { new: true }).select('-password');

    if (!user) { res.status(404); throw new Error('User not found'); }

    await logAction(req.user.id, 'user_blocked', 'user', user._id, { reason: req.body.reason }, req);
    res.json({ success: true, data: user, message: 'User blocked' });
  } catch (error) { next(error); }
};

const unblockUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      isBlocked: false,
      blockReason: ''
    }, { new: true }).select('-password');

    if (!user) { res.status(404); throw new Error('User not found'); }

    await logAction(req.user.id, 'user_unblocked', 'user', user._id, {}, req);
    res.json({ success: true, data: user, message: 'User unblocked' });
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.user.id.toString()) {
      res.status(400);
      throw new Error('Cannot delete your own admin account. Ask another admin for assistance.');
    }
    
    const user = await User.findById(id);
    if (!user) { 
      res.status(404); 
      throw new Error('User not found'); 
    }

    // Prevent deletion of other admins (only super-admin or higher privilege)
    if (user.role === 'admin') {
      res.status(403);
      throw new Error('Cannot delete admin accounts. Demote to farmer first, then delete.');
    }

    await logAction(req.user.id, 'user_deleted', 'user', user._id, { name: user.name, email: user.email, role: user.role }, req);

    // If expert, delete expert document
    if (user.role === 'expert') {
      await Expert.deleteOne({ userId: user._id });
    }
    
    // Delete all appointments
    await Appointment.deleteMany({ 
      $or: [
        { farmerId: user._id },
        { expertId: user._id }
      ]
    });
    
    // Delete user
    await User.deleteOne({ _id: user._id });

    res.json({ success: true, message: `${user.role} account deleted successfully` });
  } catch (error) { next(error); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { id } = req.params;
    
    if (!role) { 
      res.status(400); 
      throw new Error('Role is required'); 
    }
    
    if (!['farmer', 'expert', 'admin'].includes(role)) { 
      res.status(400); 
      throw new Error('Invalid role. Must be: farmer, expert, or admin'); 
    }

    const user = await User.findById(id);
    if (!user) { 
      res.status(404); 
      throw new Error('User not found'); 
    }

    // Prevent self-demotion
    if (id === req.user.id.toString() && role !== user.role) {
      res.status(400);
      throw new Error('Cannot change your own role. Ask another admin to change it.');
    }

    // Prevent promoting farmers to admin directly
    if (user.role === 'farmer' && role === 'admin') {
      res.status(403);
      throw new Error('Farmers cannot be promoted directly to admin. Only other admins can change this. Contact system administrator.');
    }

    // Prevent demoting admins except through special revoke function
    if (user.role === 'admin' && role !== 'admin') {
      res.status(403);
      throw new Error('Use /admin/user/:id/revoke-admin to demote admins');
    }

    const oldRole = user.role;
    user.role = role;
    await user.save({ validateBeforeSave: false });

    await logAction(req.user.id, 'user_role_changed', 'user', user._id, { 
      oldRole, 
      newRole: role,
      targetName: user.name,
      targetEmail: user.email 
    }, req);

    res.json({ 
      success: true, 
      data: user.toJSON ? user.toJSON() : user,
      message: `User role changed from ${oldRole} to ${role}` 
    });
  } catch (error) { next(error); }
};

// ─── EDIT FARMER PROFILE (ADMIN) ──────────────────────────────
const editFarmerProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, location, farmInfo, isBlocked } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent editing admins
    if (user.role === 'admin') {
      res.status(403);
      throw new Error('Cannot edit admin users. Revoke their admin role first.');
    }

    // Check email uniqueness if changing email
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (existingEmail) {
        res.status(400);
        throw new Error('Email already in use');
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) {
      user.address = {
        city: location.city || user.address?.city || '',
        state: location.state || user.address?.state || '',
        latitude: location.latitude || user.address?.latitude,
        longitude: location.longitude || user.address?.longitude
      };
    }
    if (farmInfo) {
      user.farmInfo = {
        primaryCrops: farmInfo.primaryCrops || user.farmInfo?.primaryCrops || [],
        landArea: farmInfo.landArea || user.farmInfo?.landArea || 0
      };
    }
    if (typeof isBlocked === 'boolean') {
      user.isBlocked = isBlocked;
    }

    await user.save({ validateBeforeSave: false });

    await logAction(req.user.id, 'farmer_profile_edited', 'user', user._id, {
      changes: { name, email, phone, location, farmInfo },
      farmerName: user.name
    }, req);

    res.json({
      success: true,
      data: user.toJSON ? user.toJSON() : user,
      message: 'Farmer profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ─── REVOKE ADMIN ROLE ────────────────────────────────────────
const revokeAdminRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent revoking your own admin access
    if (id === req.user.id.toString()) {
      res.status(400);
      throw new Error('Cannot revoke your own admin role. Ask another admin for assistance.');
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role !== 'admin') {
      res.status(400);
      throw new Error('This user is not an admin');
    }

    // Demote to farmer
    user.role = 'farmer';
    await user.save({ validateBeforeSave: false });

    await logAction(req.user.id, 'admin_role_revoked', 'user', user._id, {
      demotedUserName: user.name,
      demotedUserEmail: user.email
    }, req);

    res.json({
      success: true,
      data: user.toJSON ? user.toJSON() : user,
      message: `Admin role revoked. ${user.name} is now a farmer.`
    });
  } catch (error) {
    next(error);
  }
};

// ─── CREATE EXPERT CREDENTIALS (ADMIN) ─────────────────────
const createExpertByAdmin = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      expertiseAreas,
      qualifications,
      experienceYears,
      licenseNumber,
      consultationFee,
      availabilityHours
    } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    if (!isStrongPassword(password)) {
      res.status(400);
      throw new Error(passwordPolicyMessage);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400);
      throw new Error('An account with this email already exists');
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'expert',
      isVerified: false,
      emailVerified: true
    });

    const expert = await Expert.create({
      userId: user._id,
      professionalInfo: {
        expertiseAreas: Array.isArray(expertiseAreas) ? expertiseAreas : [],
        qualifications: Array.isArray(qualifications) ? qualifications : [],
        licenseNumber: licenseNumber || '',
        experienceYears: Number(experienceYears || 0)
      },
      consultation: {
        fee: Number(consultationFee || 0),
        availableSlots: Array.isArray(availabilityHours) ? availabilityHours : []
      },
      verification: {
        status: 'pending'
      }
    });

    await logAction(
      req.user.id,
      'expert_created_by_admin',
      'expert',
      expert._id,
      { userId: user._id, email: user.email },
      req
    );

    emailService.sendExpertRegistrationPending(user).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Expert credentials created. Expert can login only after admin approval.',
      data: {
        expertId: expert._id,
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: expert.verification.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── EXPERT VERIFICATION ─────────────────────────────────────
const getPendingExperts = async (req, res, next) => {
  try {
    const experts = await Expert.find({ 'verification.status': 'pending' })
      .populate('userId', 'name email phone profilePhoto createdAt');

    res.json({ success: true, data: experts });
  } catch (error) { next(error); }
};

const approveExpert = async (req, res, next) => {
  try {
    const expert = await Expert.findByIdAndUpdate(req.params.id, {
      'verification.status': 'approved',
      'verification.verifiedAt': new Date(),
      'verification.verifiedBy': req.user.id
    }, { new: true }).populate('userId', 'name email');

    if (!expert) { res.status(404); throw new Error('Expert not found'); }

    await User.findByIdAndUpdate(expert.userId._id, { isVerified: true });
    await logAction(req.user.id, 'expert_approved', 'expert', expert._id, {}, req);
    emailService.sendExpertApproved(expert.userId).catch(console.error);

    res.json({ success: true, data: expert, message: 'Expert approved!' });
  } catch (error) { next(error); }
};

const rejectExpert = async (req, res, next) => {
  try {
    const expert = await Expert.findByIdAndUpdate(req.params.id, {
      'verification.status': 'rejected',
      'verification.rejectionReason': req.body.reason || 'Does not meet requirements'
    }, { new: true }).populate('userId', 'name email');

    if (!expert) { res.status(404); throw new Error('Expert not found'); }

    await logAction(req.user.id, 'expert_rejected', 'expert', expert._id, { reason: req.body.reason }, req);
    emailService.sendExpertRejected(expert.userId, req.body.reason).catch(console.error);

    res.json({ success: true, message: 'Expert rejected' });
  } catch (error) { next(error); }
};

// ─── REVIEW MODERATION ────────────────────────────────────────
const getPendingReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ 'moderation.status': 'pending' })
      .populate('farmerId', 'name email profilePhoto')
      .populate('expertId', 'name email profilePhoto')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) { next(error); }
};

const approveReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, {
      'moderation.status': 'approved',
      'moderation.isVisible': true,
      'moderation.reviewedBy': req.user.id,
      'moderation.reviewedAt': new Date()
    }, { new: true });

    if (!review) { res.status(404); throw new Error('Review not found'); }

    // Update expert ratings
    const allReviews = await Review.find({
      expertId: review.expertId,
      'moderation.status': 'approved'
    });

    if (allReviews.length > 0) {
      const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      const counts = { fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 };
      allReviews.forEach(r => {
        if (r.rating === 5) counts.fiveStar++;
        else if (r.rating === 4) counts.fourStar++;
        else if (r.rating === 3) counts.threeStar++;
        else if (r.rating === 2) counts.twoStar++;
        else counts.oneStar++;
      });

      await Expert.findOneAndUpdate(
        { userId: review.expertId },
        {
          'ratings.averageRating': Math.round(avgRating * 10) / 10,
          'ratings.totalRatings': allReviews.length,
          'ratings.ratingCount': counts
        }
      );
    }

    await logAction(req.user.id, 'review_approved', 'review', review._id, {}, req);
    res.json({ success: true, message: 'Review approved!' });
  } catch (error) { next(error); }
};

const rejectReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, {
      'moderation.status': 'rejected',
      'moderation.isVisible': false,
      'moderation.reviewedBy': req.user.id,
      'moderation.reviewedAt': new Date(),
      'moderation.rejectionReason': req.body.reason || ''
    }, { new: true });

    if (!review) { res.status(404); throw new Error('Review not found'); }

    await logAction(req.user.id, 'review_rejected', 'review', review._id, { reason: req.body.reason }, req);
    res.json({ success: true, message: 'Review rejected' });
  } catch (error) { next(error); }
};

// ─── CONTACTS ─────────────────────────────────────────────────
const getContacts = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const contacts = await Contact.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: contacts });
  } catch (error) { next(error); }
};

const respondToContact = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, {
      status: 'resolved',
      response: {
        respondedBy: req.user.id,
        responseMessage: req.body.message || '',
        respondedAt: new Date()
      }
    }, { new: true });

    if (!contact) { res.status(404); throw new Error('Contact not found'); }
    res.json({ success: true, data: contact });
  } catch (error) { next(error); }
};

// ─── AUDIT LOGS ───────────────────────────────────────────────
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const logs = await AdminLog.find()
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AdminLog.countDocuments();
    res.json({
      success: true,
      data: logs,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) { next(error); }
};

// ─── POST MANAGEMENT ──────────────────────────────────────────
const getPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const posts = await Post.find()
      .populate('author', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments();
    res.json({
      success: true,
      data: posts,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) { next(error); }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) { res.status(404); throw new Error('Post not found'); }

    await logAction(req.user.id, 'post_deleted', 'post', req.params.id, { title: post.title, author: post.author }, req);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) { next(error); }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUser,
  updateUserRole,
  editFarmerProfile,
  revokeAdminRole,
  createExpertByAdmin,
  getPendingExperts,
  approveExpert,
  rejectExpert,
  getPendingReviews,
  approveReview,
  rejectReview,
  getContacts,
  respondToContact,
  getAuditLogs,
  getPosts,
  deletePost
};
