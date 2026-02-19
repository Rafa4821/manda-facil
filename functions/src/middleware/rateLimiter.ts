import * as admin from 'firebase-admin';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiter middleware for Cloud Functions
 * Prevents abuse by limiting requests per user
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request should be rate limited
   * @param userId User ID to check
   * @returns true if rate limit exceeded
   */
  async checkLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const key = `rateLimit:${userId}`;
    
    // Get or initialize rate limit data
    let data = rateLimitStore.get(key);
    
    if (!data || now > data.resetTime) {
      // Reset window
      data = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      rateLimitStore.set(key, data);
    }

    // Increment counter
    data.count++;

    // Check if limit exceeded
    if (data.count > this.config.maxRequests) {
      console.warn(`Rate limit exceeded for user: ${userId}`);
      return true;
    }

    return false;
  }

  /**
   * Clean up old entries (call periodically)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Default rate limiters
export const defaultRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
});

export const strictRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
});

export const orderRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute (max 5 orders per minute)
});

// Clean up every 5 minutes
setInterval(() => {
  defaultRateLimiter.cleanup();
  strictRateLimiter.cleanup();
  orderRateLimiter.cleanup();
}, 5 * 60 * 1000);
