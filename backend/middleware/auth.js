const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authorized to access this route. Please login.' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          error: 'User not found. Token is invalid.' 
        });
      }

      // Update last active
      req.user.lastActive = Date.now();
      await req.user.save();
      
      next();
    } catch (err) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token is invalid or expired. Please login again.' 
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Server error in authentication' 
    });
  }
};

// Optional auth - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      } catch (err) {
        // Token invalid, but continue without user
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};