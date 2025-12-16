const Review = require('../models/Review');
const Exchange = require('../models/Exchange');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendNewReviewEmail } = require('../utils/emailService');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { exchangeId, rating, comment, tags } = req.body;

    // Check if exchange exists and is completed
    const exchange = await Exchange.findById(exchangeId);
    if (!exchange) {
      return res.status(404).json({ success: false, error: 'Exchange not found' });
    }

    if (exchange.status !== 'completed') {
      return res.status(400).json({ success: false, error: 'Can only review completed exchanges' });
    }

    // Determine who to review (the other person in exchange)
    const revieweeId = exchange.requester.toString() === req.user._id.toString()
      ? exchange.receiver
      : exchange.requester;

    // Check if already reviewed
    const existingReview = await Review.findOne({ reviewer: req.user._id, exchange: exchangeId });
    if (existingReview) {
      return res.status(400).json({ success: false, error: 'Already reviewed this exchange' });
    }

    const review = await Review.create({
      reviewer: req.user._id,
      reviewee: revieweeId,
      exchange: exchangeId,
      rating,
      comment,
      tags
    });

    await review.populate('reviewer', 'name avatar');

    // Create notification
    await Notification.create({
      user: revieweeId,
      type: 'new_review',
      title: 'New Review',
      message: `${req.user.name} left you a ${rating}-star review!`,
      relatedUser: req.user._id
    });

    // Send email
    const reviewee = await User.findById(revieweeId);
    sendNewReviewEmail(reviewee.email, reviewee.name, req.user.name, rating)
      .catch(err => console.error('Email error:', err));

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, error: 'Error creating review' });
  }
};

// @desc    Get reviews for user
// @route   GET /api/reviews/user/:userId
// @access  Public
exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar')
      .populate('exchange')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews, count: reviews.length });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ success: false, error: 'Error fetching reviews' });
  }
};