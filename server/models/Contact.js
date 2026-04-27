const mongoose = require('mongoose');

const contactSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    message: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    topic: { type: String, default: 'general' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved', 'closed'],
      default: 'new'
    },
    ticketId: {
      type: String,
      unique: true
    },
    response: {
      respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      responseMessage: { type: String, default: '' },
      respondedAt: Date
    }
  },
  { timestamps: true }
);

contactSchema.pre('save', function (next) {
  if (!this.ticketId) {
    this.ticketId = 'FMX-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  next();
});

contactSchema.index({ status: 1 });

const Contact = mongoose.model('Contact', contactSchema);
module.exports = Contact;
