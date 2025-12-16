const User = require('../models/User');
const Skill = require('../models/Skill');
const { sanitizeUser } = require('../utils/helpers');

// @desc    Get logged-in user profile
// @route   GET /api/users/me
// @access  Private
exports.getMyProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    data: sanitizeUser(req.user)
  });
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('skillsOffered')
    .populate('skillsWanted');

  if (!user || !user.isActive) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  res.status(200).json({
    success: true,
    data: sanitizeUser(user)
  });
};

// @desc    Update profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const updates = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: sanitizeUser(user)
  });
};

// @desc    Get all users (for browsing)
// @route   GET /api/users
// @access  Public
exports.getUsers = async (req, res) => {
  const users = await User.find({ isActive: true })
    .select('-password')
    .sort({ rating: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
};
