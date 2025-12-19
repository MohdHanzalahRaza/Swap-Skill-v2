const User = require('../models/User');
const { paginate } = require('../utils/helpers');

// @desc    Get all users
// @route   GET /api/users
// @access  Public
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, location } = req.query;
    const { skip, limit: pageLimit } = paginate(page, limit);

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('skillsOffered', 'name category level')
      .populate('skillsWanted', 'name category level')
      .skip(skip)
      .limit(pageLimit)
      .sort({ rating: -1, totalReviews: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / pageLimit),
        totalUsers: total,
        hasMore: skip + users.length < total
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching users'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('skillsOffered')
      .populate('skillsWanted');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(404).json({
        success: false,
        error: 'User account is deactivated'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, location, socialLinks } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location) user.location = { ...user.location, ...location };
    if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };

    await user.save();

    // Populate skills before sending response
    await user.populate('skillsOffered skillsWanted');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating profile'
    });
  }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image'
      });
    }

    // Create avatar URL - This will be accessible via the static middleware
    const avatarUrl = `/uploads/${req.file.filename}`;

    // Update user with new avatar
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('skillsOffered skillsWanted');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { 
        avatar: avatarUrl,
        user: user
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      error: 'Error uploading avatar'
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
exports.searchUsers = async (req, res) => {
  try {
    const { q, category, minRating } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const query = {
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ]
    };

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    const users = await User.find(query)
      .select('-password')
      .populate('skillsOffered')
      .populate('skillsWanted')
      .limit(20)
      .sort({ rating: -1 });

    // Filter by category if provided
    let results = users;
    if (category) {
      results = users.filter(user => 
        user.skillsOffered.some(skill => skill.category === category) ||
        user.skillsWanted.some(skill => skill.category === category)
      );
    }

    res.status(200).json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Error searching users'
    });
  }
};

// @desc    Get user stats
// @route   GET /api/users/:id/stats
// @access  Public
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('skillsOffered')
      .populate('skillsWanted');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const Exchange = require('../models/Exchange');
    const Review = require('../models/Review');

    // Get exchange stats
    const totalExchangesRequested = await Exchange.countDocuments({
      requester: user._id
    });

    const totalExchangesReceived = await Exchange.countDocuments({
      receiver: user._id
    });

    const completedExchanges = await Exchange.countDocuments({
      $or: [
        { requester: user._id, status: 'completed' },
        { receiver: user._id, status: 'completed' }
      ]
    });

    // Get recent reviews
    const recentReviews = await Review.find({ reviewee: user._id })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = {
      totalSkillsOffered: user.skillsOffered.length,
      totalSkillsWanted: user.skillsWanted.length,
      totalExchangesRequested,
      totalExchangesReceived,
      completedExchanges,
      rating: user.rating,
      totalReviews: user.totalReviews,
      successRate: user.successRate,
      badges: user.badges,
      recentReviews,
      memberSince: user.createdAt
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user stats'
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const { type = 'rating', limit = 10 } = req.query;

    let sortField = { rating: -1, totalReviews: -1 };

    if (type === 'exchanges') {
      sortField = { totalExchanges: -1 };
    } else if (type === 'reviews') {
      sortField = { totalReviews: -1 };
    }

    const users = await User.find({ isActive: true })
      .select('name avatar rating totalReviews totalExchanges badges')
      .sort(sortField)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching leaderboard'
    });
  }
};

// @desc    Follow/Unfollow user (for future feature)
// @route   POST /api/users/:id/follow
// @access  Private
exports.toggleFollow = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Follow feature coming soon!'
    });
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({
      success: false,
      error: 'Error toggling follow'
    });
  }
};