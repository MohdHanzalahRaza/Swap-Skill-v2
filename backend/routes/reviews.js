const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateReview, validateObjectId } = require('../middleware/validation');
const {
  createReview,
  getUserReviews
} = require('../controllers/reviewController');

router.post('/', protect, validateReview, createReview);
router.get('/user/:userId', validateObjectId, getUserReviews);

module.exports = router;
