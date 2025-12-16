const mongoose = require('mongoose');

const exchangeSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillOffered: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  skillWanted: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  duration: {
    type: Number, // in hours
    default: 1
  },
  scheduledDate: Date,
  completedDate: Date,
  notes: String
}, {
  timestamps: true
});

// Index for queries
exchangeSchema.index({ requester: 1, status: 1 });
exchangeSchema.index({ receiver: 1, status: 1 });

module.exports = mongoose.model('Exchange', exchangeSchema);