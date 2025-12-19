const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'exchange_request',
      'exchange_accepted',
      'exchange_rejected',
      'exchange_scheduled',   // ✅ ADD
      'exchange_completed',   // ✅ ADD
      'exchange_cancelled',   // ✅ ADD
      'new_message',
      'new_review',
      'skill_match',
      'badge_earned'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedExchange: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exchange'
  },
  read: {
    type: Boolean,
    default: false
  },
  actionUrl: String
}, {
  timestamps: true
});

// Index for user notifications
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);