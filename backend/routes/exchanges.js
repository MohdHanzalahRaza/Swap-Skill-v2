const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateExchange, validateObjectId } = require('../middleware/validation');
const {
  createExchange,
  getMyExchanges,
  updateExchangeStatus
} = require('../controllers/exchangeController');

router.post('/', protect, validateExchange, createExchange);
router.get('/', protect, getMyExchanges);
router.put('/:id/status', protect, validateObjectId, updateExchangeStatus);

module.exports = router;
