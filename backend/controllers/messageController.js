const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Receiver ID and content are required' 
      });
    }

    // Validate receiverId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid receiver ID'
      });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content
    });

    // Populate sender and receiver with full data
    await message.populate([
      { path: 'sender', select: 'name avatar email' },
      { path: 'receiver', select: 'name avatar email' }
    ]);

    // Emit socket event to receiver
    const socketSetup = req.app.get('socketSetup');
    if (socketSetup && socketSetup.emitToUser) {
      socketSetup.emitToUser(receiverId, 'receive_message', message);
      console.log(`📨 Message sent from ${req.user.name} to ${receiverId}`);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Error sending message' });
  }
};

// @desc    Get conversation between two users
// @route   GET /api/messages/conversation/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`📖 Request to fetch conversation between ${req.user._id} and ${userId}`);

    // Validate userId is a valid ObjectId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ Invalid userId:', userId);
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Check if the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      console.error('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const { page = 1, limit = 50 } = req.query;

    // Fetch messages
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
      .sort({ createdAt: 1 }) // Sort in ascending order (oldest first)
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .populate('sender', 'name avatar email')
      .populate('receiver', 'name avatar email');

    console.log(`✅ Found ${messages.length} messages between ${req.user.name} and ${otherUser.name}`);
    
    // Log each message for debugging
    messages.forEach((msg, idx) => {
      console.log(`  Message ${idx + 1}:`, {
        id: msg._id,
        from: msg.sender?.name,
        to: msg.receiver?.name,
        content: msg.content?.substring(0, 30),
        createdAt: msg.createdAt
      });
    });

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, read: false },
      { read: true, readAt: Date.now() }
    );

    // Return in chronological order (oldest first) - already sorted
    res.status(200).json({ 
      success: true, 
      data: messages,
      count: messages.length 
    });

  } catch (error) {
    console.error('❌ Get conversation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching conversation',
      details: error.message 
    });
  }
};

// @desc    Get all conversations
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    console.log(`📋 Fetching conversations for user ${req.user._id} (${req.user.name})`);

    // Get all unique conversations
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiver', req.user._id] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate user details
    await User.populate(messages, { 
      path: '_id',
      select: 'name avatar email'
    });

    await Message.populate(messages, [
      { path: 'lastMessage.sender', select: 'name avatar email' },
      { path: 'lastMessage.receiver', select: 'name avatar email' }
    ]);

    console.log(`✅ Found ${messages.length} conversations for ${req.user.name}`);
    
    // Log each conversation for debugging
    messages.forEach((conv, idx) => {
      console.log(`  Conversation ${idx + 1}:`, {
        otherUser: conv._id?.name,
        lastMessage: conv.lastMessage?.content?.substring(0, 20),
        unreadCount: conv.unreadCount
      });
    });

    res.status(200).json({ 
      success: true, 
      data: messages,
      count: messages.length 
    });

  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching conversations',
      details: error.message 
    });
  }
};