/**
 * Lightweight per-socket rate limiting for LAN chat events.
 * Phase 4 AppSec control — not a substitute for a reverse proxy or WAF.
 */

class RateLimiter {
  constructor(maxEvents, windowMs) {
    this.maxEvents = maxEvents;
    this.windowMs = windowMs;
    this.buckets = new Map();
  }

  allow(key) {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(key, bucket);
    }
    if (bucket.count >= this.maxEvents) {
      return false;
    }
    bucket.count += 1;
    return true;
  }

  clear(key) {
    this.buckets.delete(key);
  }
}

function isNameTaken(users, name, excludeSocketId) {
  for (const [socketId, userName] of users) {
    if (userName === name && socketId !== excludeSocketId) {
      return true;
    }
  }
  return false;
}

module.exports = {
  RateLimiter,
  isNameTaken,
};
