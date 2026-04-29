const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const parseAllowedOrigins = () => {
  const rawOrigins = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URLS,
    process.env.ALLOWED_ORIGINS
  ].filter(Boolean).join(',');

  return new Set(
    rawOrigins
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
};

const sanitizeInput = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeInput);
  }

  if (!value || typeof value !== 'object') {
    return typeof value === 'string' ? value.replace(/\0/g, '').trim() : value;
  }

  return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
    const normalizedKey = String(key).trim();

    if (
      !normalizedKey ||
      BLOCKED_KEYS.has(normalizedKey) ||
      normalizedKey.startsWith('$') ||
      normalizedKey.includes('.')
    ) {
      return accumulator;
    }

    accumulator[normalizedKey] = sanitizeInput(nestedValue);
    return accumulator;
  }, {});
};

const sanitizeRequest = (req, _res, next) => {
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  req.params = sanitizeInput(req.params);
  next();
};

const createCorsOptions = () => {
  const allowedOrigins = parseAllowedOrigins();

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.size === 0 || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      const error = new Error('Origin not allowed by CORS policy');
      error.statusCode = 403;
      return callback(error);
    },
    credentials: true
  };
};

const verifyTrustedOrigin = (req, res, next) => {
  if (!STATE_CHANGING_METHODS.has(req.method)) {
    return next();
  }

  const allowedOrigins = parseAllowedOrigins();
  if (!allowedOrigins.size) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (!origin && !referer) {
    return next();
  }

  let requestOrigin = origin;

  if (!requestOrigin && referer) {
    try {
      // Some clients may send a referer without a protocol (e.g. "localhost:3000");
      // normalize by assuming http when missing to avoid URL parsing errors.
      const normalizedReferer = /:\/\//.test(referer) ? referer : `http://${referer.replace(/^\/+/, '')}`;
      requestOrigin = new URL(normalizedReferer).origin;
    } catch (_error) {
      res.status(403);
      return next(new Error('Invalid request origin'));
    }
  }

  if (requestOrigin && !allowedOrigins.has(requestOrigin)) {
    res.status(403);
    return next(new Error('Cross-site request blocked'));
  }

  return next();
};

module.exports = {
  createCorsOptions,
  sanitizeRequest,
  verifyTrustedOrigin,
  __test__: {
    parseAllowedOrigins,
    sanitizeInput
  }
};
