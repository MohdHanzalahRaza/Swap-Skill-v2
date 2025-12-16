const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a skill name'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      'Programming',
      'Design',
      'Marketing',
      'Business',
      'Music',
      'Art',
      'Language',
      'Cooking',
      'Sports',
      'Photography',
      'Writing',
      'Video Editing',
      'Other'
    ]
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Beginner'
  },
  tags: [String],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['offer', 'want'],
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  popularity: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search
skillSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Skill', skillSchema);