const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateBooking, validateObjectId } = require('../middleware/validation');
const {
  createBooking,
  getMyBookings,
  updateBookingStatus
} = require('../controllers/bookingController');

router.post('/', protect, validateBooking, createBooking);
router.get('/', protect, getMyBookings);
router.put('/:id', protect, validateObjectId, updateBookingStatus);

module.exports = router;
