const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(protect, admin);

// Dashboard
router.get('/dashboard', getDashboardStats);
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.put('/user/:id/block', blockUser);
router.put('/user/:id/unblock', unblockUser);
router.delete('/user/:id', deleteUser);
router.put('/users/:id/role', updateUserRole);
router.put('/farmer/:id/edit', editFarmerProfile);
router.put('/user/:id/revoke-admin', revokeAdminRole);
router.post('/expert/create', createExpertByAdmin);

// Expert verification
router.get('/experts/pending', getPendingExperts);
router.put('/expert/:id/approve', approveExpert);
router.put('/expert/:id/reject', rejectExpert);

// Review moderation
router.get('/reviews/pending', getPendingReviews);
router.put('/review/:id/approve', approveReview);
router.put('/review/:id/reject', rejectReview);

// Contact management
router.get('/contacts', getContacts);
router.put('/contact/:id/respond', respondToContact);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Posts
router.get('/posts', getPosts);
router.delete('/post/:id', deletePost);

module.exports = router;
