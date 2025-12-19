const Exchange = require('../models/Exchange');
const Notification = require('../models/Notification');

// @desc    Create exchange request
// @route   POST /api/exchanges
// @access  Private
exports.createExchange = async (req, res) => {
  const { receiverId, skillOfferedId, skillWantedId, message } = req.body;

  const exchange = await Exchange.create({
    requester: req.user._id,
    receiver: receiverId,
    skillOffered: skillOfferedId,
    skillWanted: skillWantedId,
    message
  });

  await Notification.create({
    user: receiverId,
    type: 'exchange_request',
    title: 'New Exchange Request',
    message: `${req.user.name} sent you an exchange request`,
    relatedUser: req.user._id,
    relatedExchange: exchange._id
  });

  res.status(201).json({
    success: true,
    data: exchange
  });
};

// @desc    Get my exchanges
// @route   GET /api/exchanges
// @access  Private
exports.getMyExchanges = async (req, res) => {
  const exchanges = await Exchange.find({
    $or: [
      { requester: req.user._id },
      { receiver: req.user._id }
    ]
  })
    .populate('requester receiver', 'name avatar')
    .populate('skillOffered skillWanted')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: exchanges
  });
};

// @desc    Get exchange by ID
// @route   GET /api/exchanges/:id
// @access  Private
exports.getExchangeById = async (req, res) => {
  const exchange = await Exchange.findById(req.params.id)
    .populate('requester receiver', 'name avatar')
    .populate('skillOffered skillWanted');

  if (!exchange) {
    return res.status(404).json({
      success: false,
      error: 'Exchange not found'
    });
  }

  // Only participants can view
  if (
    exchange.requester._id.toString() !== req.user._id.toString() &&
    exchange.receiver._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized'
    });
  }

  res.status(200).json({
    success: true,
    data: exchange
  });
};


// @desc    Update exchange status
// @route   PUT /api/exchanges/:id
// @access  Private
exports.updateExchangeStatus = async (req, res) => {
  const { status } = req.body;

  const exchange = await Exchange.findById(req.params.id);
  if (!exchange) {
    return res.status(404).json({ success: false, error: 'Exchange not found' });
  }

  // Only receiver can accept/reject
  if (exchange.receiver.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: 'Not authorized' });
  }

  exchange.status = status;
  await exchange.save();

  await Notification.create({
    user: exchange.requester,
    type: `exchange_${status}`,
    title: `Exchange ${status}`,
    message: `${req.user.name} ${status} your exchange request`,
    relatedExchange: exchange._id
  });

  res.status(200).json({
    success: true,
    data: exchange
  });
};

// @desc    Schedule exchange session
// @route   PUT /api/exchanges/:id/schedule
// @access  Private
exports.scheduleExchange = async (req, res) => {
  try {
    const { scheduledDate } = req.body;
    const exchange = await Exchange.findById(req.params.id);

    if (!exchange) {
      return res.status(404).json({
        success: false,
        error: 'Exchange not found'
      });
    }

    // Check if user is part of exchange
    if (
      exchange.requester.toString() !== req.user._id.toString() &&
      exchange.receiver.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to schedule this exchange'
      });
    }

    // Only accepted exchanges can be scheduled
    if (exchange.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Exchange must be accepted first'
      });
    }

    // Update exchange with scheduled date and change status
    exchange.scheduledDate = scheduledDate;
    exchange.status = 'scheduled';
    await exchange.save();

    // Populate for response
    await exchange.populate('requester receiver skillOffered skillWanted');

    // Create notification for the other user
    const otherUserId = exchange.requester._id.toString() === req.user._id.toString() 
      ? exchange.receiver._id 
      : exchange.requester._id;

    await Notification.create({
      user: otherUserId,
      type: 'exchange_scheduled',
      title: 'Session Scheduled',
      message: `${req.user.name} scheduled your exchange session`,
      relatedUser: req.user._id,
      relatedExchange: exchange._id
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(otherUserId.toString()).emit('exchange_updated', exchange);
    }

    res.status(200).json({
      success: true,
      message: 'Exchange scheduled successfully',
      data: exchange
    });
  } catch (error) {
    console.error('Schedule exchange error:', error);
    res.status(500).json({
      success: false,
      error: 'Error scheduling exchange'
    });
  }
};

// @desc    Cancel exchange
// @route   DELETE /api/exchanges/:id
// @access  Private
exports.cancelExchange = async (req, res) => {
  const exchange = await Exchange.findById(req.params.id);

  if (!exchange) {
    return res.status(404).json({
      success: false,
      error: 'Exchange not found'
    });
  }

  // Only requester can cancel
  if (exchange.requester.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized'
    });
  }

  // Only pending exchanges can be cancelled
  if (exchange.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: 'Only pending exchanges can be cancelled'
    });
  }

  exchange.status = 'cancelled';
  await exchange.save();

  await Notification.create({
    user: exchange.receiver,
    type: 'exchange_cancelled',
    title: 'Exchange Cancelled',
    message: `${req.user.name} cancelled the exchange request`,
    relatedExchange: exchange._id
  });

  res.status(200).json({
    success: true,
    data: exchange
  });
};
