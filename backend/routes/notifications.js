const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, validateObjectId, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, validateObjectId, deleteNotification);

module.exports = router;
