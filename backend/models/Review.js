const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exchange: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exchange',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    enum: [
      'Excellent Communication',
      'Very Knowledgeable',
      'Patient Teacher',
      'Well Prepared',
      'Punctual',
      'Friendly',
      'Professional'
    ]
  }]
}, {
  timestamps: true
});

// Prevent duplicate reviews
reviewSchema.index({ reviewer: 1, exchange: 1 }, { unique: true });

// Update user rating after review
reviewSchema.post('save', async function() {
  const Review = this.constructor;
  const User = mongoose.model('User');
  
  const reviews = await Review.find({ reviewee: this.reviewee });
  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  
  await User.findByIdAndUpdate(this.reviewee, {
    rating: avgRating.toFixed(1),
    totalReviews: reviews.length
  });
});

module.exports = mongoose.model('Review', reviewSchema);