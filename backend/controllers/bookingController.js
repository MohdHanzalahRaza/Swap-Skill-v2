const Booking = require('../models/Booking');
const { sendBookingReminderEmail } = require('../utils/emailService');
const { generateMeetingLink } = require('../utils/helpers');

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { exchangeId, startTime, duration, notes } = req.body;

    const exchange = await Exchange.findById(exchangeId)
      .populate('requester receiver');

    if (!exchange) {
      return res.status(404).json({ success: false, error: 'Exchange not found' });
    }

    if (exchange.status !== 'accepted') {
      return res.status(400).json({ success: false, error: 'Exchange must be accepted first' });
    }

    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const booking = await Booking.create({
      exchange: exchangeId,
      teacher: exchange.receiver,
      student: exchange.requester,
      startTime: startDate,
      endTime: endDate,
      duration,
      notes,
      meetingLink: generateMeetingLink(exchangeId)
    });

    await booking.populate('teacher student exchange');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, error: 'Error creating booking' });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const { status, type = 'all' } = req.query;

    let query = {};

    if (type === 'teaching') {
      query.teacher = req.user._id;
    } else if (type === 'learning') {
      query.student = req.user._id;
    } else {
      query.$or = [{ teacher: req.user._id }, { student: req.user._id }];
    }

    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('teacher student', 'name avatar')
      .populate('exchange')
      .sort({ startTime: 1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, error: 'Error fetching bookings' });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ success: false, error: 'Error updating booking' });
  }
};