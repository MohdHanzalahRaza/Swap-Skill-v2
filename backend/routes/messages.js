const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const {
  sendMessage,
  getConversation,
  getConversations
} = require('../controllers/messageController');

router.post('/', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/conversation/:id', protect, validateObjectId, getConversation);

module.exports = router;
