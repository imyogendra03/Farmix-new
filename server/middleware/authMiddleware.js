const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authorize = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) {
    return next();
  }

  res.status(403);
  return next(new Error(`Not authorized${roles.length ? ` as ${roles.join(' or ')}` : ''}`));
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password -refreshTokens -verificationToken -passwordResetToken');
      req.auth = { token, decoded };

      if (!req.user) {
        res.status(401);
        return next(new Error('User not found'));
      }

      if (!req.user.isActive) {
        res.status(403);
        return next(new Error('Your account is inactive'));
      }

      if (req.user.isBlocked) {
        res.status(403);
        return next(new Error('Your account has been blocked'));
      }

      return next();
    } catch (error) {
      console.error('Auth error:', error.message);

      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        res.status(401);
        return next(new Error('Authentication token has expired'));
      }

      if (error.name === 'JsonWebTokenError') {
        res.status(401);
        return next(new Error('Invalid authentication token'));
      }

      res.status(401);
      return next(new Error('Not authorized, token failed'));
    }
  } else {
    res.status(401);
    return next(new Error('Not authorized, no token'));
  }
};

const admin = authorize('admin');
const expert = authorize('expert', 'admin');
const farmer = authorize('farmer', 'admin');

module.exports = { protect, authorize, admin, expert, farmer };
