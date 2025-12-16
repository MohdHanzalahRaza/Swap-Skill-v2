const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Validation rules for user registration
exports.validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  exports.handleValidationErrors
];

// Validation rules for login
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  exports.handleValidationErrors
];

// Validation rules for skill creation
exports.validateSkill = [
  body('name')
    .trim()
    .notEmpty().withMessage('Skill name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Skill name must be between 2 and 100 characters'),
  
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn([
      'Programming', 'Design', 'Marketing', 'Business', 
      'Music', 'Art', 'Language', 'Cooking', 
      'Sports', 'Photography', 'Writing', 'Video Editing', 'Other'
    ]).withMessage('Invalid category'),
  
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .withMessage('Invalid skill level'),
  
  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(['offer', 'want']).withMessage('Type must be either offer or want'),
  
  exports.handleValidationErrors
];

// Validation rules for exchange request
exports.validateExchange = [
  body('receiverId')
    .notEmpty().withMessage('Receiver ID is required')
    .isMongoId().withMessage('Invalid receiver ID'),
  
  body('skillOfferedId')
    .notEmpty().withMessage('Skill offered ID is required')
    .isMongoId().withMessage('Invalid skill offered ID'),
  
  body('skillWantedId')
    .notEmpty().withMessage('Skill wanted ID is required')
    .isMongoId().withMessage('Invalid skill wanted ID'),
  
  body('message')
    .optional()
    .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
  
  exports.handleValidationErrors
];

// Validation rules for review
exports.validateReview = [
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  
  body('exchangeId')
    .notEmpty().withMessage('Exchange ID is required')
    .isMongoId().withMessage('Invalid exchange ID'),
  
  exports.handleValidationErrors
];

// Validation for MongoDB ObjectId params
exports.validateObjectId = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  
  exports.handleValidationErrors
];

// Validation for pagination query params
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  exports.handleValidationErrors
];

// Validation for booking
exports.validateBooking = [
  body('exchangeId')
    .notEmpty().withMessage('Exchange ID is required')
    .isMongoId().withMessage('Invalid exchange ID'),
  
  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .isISO8601().withMessage('Invalid date format'),
  
  body('duration')
    .notEmpty().withMessage('Duration is required')
    .isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  
  exports.handleValidationErrors
];

// Validation for profile update
exports.validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  
  body('location.city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long'),
  
  body('location.country')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Country name too long'),
  
  exports.handleValidationErrors
];
