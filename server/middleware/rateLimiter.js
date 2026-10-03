/**
 * In-memory sliding window rate limiter middleware.
 * Protects registration and resume endpoints from brute force and name enumeration.
 */
export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 20, message = 'Too many requests. Please try again later.' } = {}) {
  const hits = new Map();

  // Periodic cleanup of expired rate limit windows every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now - record.startTime > windowMs) {
        hits.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = hits.get(ip);
    if (!record || now - record.startTime > windowMs) {
      hits.set(ip, { count: 1, startTime: now });
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json({
        success: false,
        error: message
      });
    }

    record.count++;
    next();
  };
}
