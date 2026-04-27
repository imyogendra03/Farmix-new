const logger = require('../utils/logger');

const normalizeError = (err = {}) => {
  if (err.name === 'CastError') {
    return { statusCode: 400, message: `Invalid ${err.path}` };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {})
      .map((item) => item.message)
      .filter(Boolean)
      .join(', ');

    return {
      statusCode: 400,
      message: message || 'Validation failed'
    };
  }

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'resource';
    return { statusCode: 409, message: `${duplicateField} already exists` };
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Authentication token is invalid or expired' };
  }

  // Handle auth middleware error messages
  if (err.message === 'Authentication token has expired' ||
      err.message === 'Invalid authentication token' ||
      err.message === 'Not authorized, token failed' ||
      err.message === 'Not authorized, no token') {
    return { statusCode: 401, message: err.message };
  }

  return {
    statusCode: err.statusCode || err.status || 500,
    message: err.message || 'An unexpected error occurred'
  };
};

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, _next) => {
  const normalized = normalizeError(err);
  const statusCode = normalized.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  const requestId = req.id || req.headers['x-request-id'] || null;

  logger.error(normalized.message, {
    requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  res.status(statusCode).json({
    success: false,
    message: normalized.message,
    requestId,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * Wrap async route handlers to catch unhandled promise rejections
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler, notFoundHandler, normalizeError };
