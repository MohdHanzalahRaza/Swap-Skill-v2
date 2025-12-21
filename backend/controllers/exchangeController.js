const Exchange = require('../models/Exchange');
const Notification = require('../models/Notification');
// 1. Added the import as requested
const { createAndEmitNotification } = require('./notificationController');

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

  // Updated to use the helper for real-time emission
  await createAndEmitNotification(
    req,
    receiverId,
    'exchange_request',
    `${req.user.name} sent you an exchange request`,
    req.user._id,
    { exchangeId: exchange._id }
  );

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


// @desc    Update exchange status (Handles Accept/Reject)
// @route   PUT /api/exchanges/:id
// @access  Private
exports.updateExchangeStatus = async (req, res) => {
  const { status } = req.body; // status will be 'accepted' or 'rejected'

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

  // 2. Added the dynamic notification trigger here
  // This covers both accept and reject scenarios based on the 'status' variable
  await createAndEmitNotification(
    req,
    exchange.requester,
    'exchange',
    `${req.user.name} ${status} your exchange request`,
    req.user._id,
    { exchangeId: exchange._id }
  );

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

    if (
      exchange.requester.toString() !== req.user._id.toString() &&
      exchange.receiver.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to schedule this exchange'
      });
    }

    if (exchange.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Exchange must be accepted first'
      });
    }

    exchange.scheduledDate = scheduledDate;
    exchange.status = 'scheduled';
    await exchange.save();

    await exchange.populate('requester receiver skillOffered skillWanted');

    const otherUserId = exchange.requester._id.toString() === req.user._id.toString() 
      ? exchange.receiver._id 
      : exchange.requester._id;

    // Updated to use the helper
    await createAndEmitNotification(
      req,
      otherUserId,
      'exchange_scheduled',
      `${req.user.name} scheduled your exchange session`,
      req.user._id,
      { exchangeId: exchange._id }
    );

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

  if (exchange.requester.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized'
    });
  }

  if (exchange.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: 'Only pending exchanges can be cancelled'
    });
  }

  exchange.status = 'cancelled';
  await exchange.save();

  // Updated to use the helper
  await createAndEmitNotification(
    req,
    exchange.receiver,
    'exchange_cancelled',
    `${req.user.name} cancelled the exchange request`,
    req.user._id,
    { exchangeId: exchange._id }
  );

  res.status(200).json({
    success: true,
    data: exchange
  });
};