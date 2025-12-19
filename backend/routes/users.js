const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadAvatar, handleUploadError } = require('../middleware/upload');
const { validateProfileUpdate, validateObjectId } = require('../middleware/validation');
const {
  getAllUsers,
  getUserById,
  updateProfile,
  uploadAvatar: uploadAvatarController,
  searchUsers,
  getUserStats,
  getLeaderboard,
  toggleFollow
} = require('../controllers/userController');

// Public routes
router.get('/', getAllUsers);
router.get('/search', searchUsers);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', validateObjectId, getUserById);
router.get('/:id/stats', validateObjectId, getUserStats);

// Protected routes
router.put('/profile', protect, validateProfileUpdate, updateProfile);

// FIX: Avatar upload route - THIS WAS MISSING!
router.post('/avatar', protect, uploadAvatar, handleUploadError, uploadAvatarController);

router.post('/:id/follow', protect, validateObjectId, toggleFollow);

module.exports = router;