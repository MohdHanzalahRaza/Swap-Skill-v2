const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateProfileUpdate, validateObjectId } = require('../middleware/validation');
const {
  getUsers,
  getUserById,
  updateProfile
} = require('../controllers/userController');

router.get('/', getUsers);
router.get('/:id', validateObjectId, getUserById);
router.put('/profile', protect, validateProfileUpdate, updateProfile);

module.exports = router;
