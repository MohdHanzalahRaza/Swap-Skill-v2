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
