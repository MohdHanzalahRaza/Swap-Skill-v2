const Skill = require('../models/Skill');
const User = require('../models/User');

// @desc    Add skill
// @route   POST /api/skills
// @access  Private
exports.addSkill = async (req, res) => {
  const skill = await Skill.create({
    ...req.body,
    user: req.user._id
  });

  // Attach skill to user
  const field = skill.type === 'offer' ? 'skillsOffered' : 'skillsWanted';
  await User.findByIdAndUpdate(req.user._id, {
    $push: { [field]: skill._id }
  });

  res.status(201).json({
    success: true,
    data: skill
  });
};

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
exports.getSkills = async (req, res) => {
  const { search, category } = req.query;

  const query = {};
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const skills = await Skill.find(query)
    .populate('user', 'name avatar rating');

  res.status(200).json({
    success: true,
    count: skills.length,
    data: skills
  });
};

// @desc    Delete skill
// @route   DELETE /api/skills/:id
// @access  Private
exports.deleteSkill = async (req, res) => {
  const skill = await Skill.findById(req.params.id);

  if (!skill || skill.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: 'Not authorized' });
  }

  await skill.deleteOne();

  const field = skill.type === 'offer' ? 'skillsOffered' : 'skillsWanted';
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { [field]: skill._id }
  });

  res.status(200).json({
    success: true,
    message: 'Skill removed'
  });
};
