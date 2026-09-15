const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campusone_super_secure_jwt_secret_token_2026');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid session. User not found.',
        });
      }
      req.user = user;
      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid token. Please log in again.',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Auth middleware error: ' + error.message,
    });
  }
};

module.exports = authMiddleware;
