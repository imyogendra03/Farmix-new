/**
 * Simple in-memory TTL cache for API responses
 * Avoids external dependencies — no npm install required
 */
const cache = new Map();

/**
 * Set a value in cache with a TTL (in seconds)
 */
const set = (key, value, ttlSeconds = 300) => {
  const expiry = Date.now() + ttlSeconds * 1000;
  cache.set(key, { value, expiry });
};

/**
 * Get a cached value. Returns null if expired or missing.
 */
const get = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

/**
 * Delete a cache entry
 */
const del = (key) => cache.delete(key);

/**
 * Clear all cache
 */
const clear = () => cache.clear();

/**
 * Express middleware factory: caches a route's response for ttlSeconds
 */
const cacheMiddleware = (ttlSeconds = 300) => (req, res, next) => {
  const key = `route:${req.originalUrl}`;
  const cached = get(key);
  if (cached) {
    return res.status(200).json(cached);
  }
  // Override res.json to intercept and cache the response
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      set(key, data, ttlSeconds);
    }
    return originalJson(data);
  };
  next();
};

module.exports = { set, get, del, clear, cacheMiddleware };
