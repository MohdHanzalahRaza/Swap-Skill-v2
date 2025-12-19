// ============================================
// FILE: backend/routes/exchanges.js
// REPLACE ENTIRE FILE WITH THIS
// ============================================
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateExchange, validateObjectId } = require('../middleware/validation');
const {
  createExchange,
  getMyExchanges,
  getExchangeById,
  updateExchangeStatus,
  cancelExchange,
  scheduleExchange  // ADD THIS
} = require('../controllers/exchangeController');

router.post('/', protect, validateExchange, createExchange);
router.get('/', protect, getMyExchanges);
router.get('/:id', protect, validateObjectId, getExchangeById);
router.put('/:id/status', protect, validateObjectId, updateExchangeStatus);
router.put('/:id/schedule', protect, validateObjectId, scheduleExchange); // ADD THIS LINE
router.delete('/:id', protect, validateObjectId, cancelExchange);

module.exports = router;