const mongoose = require('mongoose');

const adminLogSchema = mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: { type: String, required: true },
    entityType: { type: String, default: '' },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    changes: {
      before: { type: mongoose.Schema.Types.Mixed, default: {} },
      after: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info'
    }
  },
  { timestamps: true }
);

adminLogSchema.index({ adminId: 1 });
adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ action: 1 });

const AdminLog = mongoose.model('AdminLog', adminLogSchema);
module.exports = AdminLog;
