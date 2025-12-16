const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateSkill, validateObjectId } = require('../middleware/validation');
const {
  getSkills,
  addSkill,
  deleteSkill
} = require('../controllers/skillController');

router.get('/', getSkills);
router.post('/', protect, validateSkill, addSkill);
router.delete('/:id', protect, validateObjectId, deleteSkill);

module.exports = router;
