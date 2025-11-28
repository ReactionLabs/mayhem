/**
 * Rate Limiting Utilities
 * For production, use @upstash/ratelimit with Redis
 * For now, provides in-memory rate limiting (single instance only)
 */

type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitStore = {
  [key: string]: {
    count: number;
    resetAt: number;
  };
};

// In-memory store (single instance only - use Redis in production)
const rateLimitStore: RateLimitStore = {};

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const key in rateLimitStore) {
      if (rateLimitStore[key].resetAt < now) {
        delete rateLimitStore[key];
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Simple rate limiter (in-memory)
 * For production, replace with @upstash/ratelimit
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 10000 }
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const key = identifier.toLowerCase();

  // Check if entry exists and is still valid
  if (rateLimitStore[key] && rateLimitStore[key].resetAt > now) {
    if (rateLimitStore[key].count >= config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetAt: rateLimitStore[key].resetAt,
      };
    }
    rateLimitStore[key].count++;
  } else {
    // Create new entry or reset expired one
    rateLimitStore[key] = {
      count: 1,
      resetAt: now + config.windowMs,
    };
  }

  return {
    success: true,
    remaining: config.maxRequests - rateLimitStore[key].count,
    resetAt: rateLimitStore[key].resetAt,
  };
}

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(req: {
  headers: { [key: string]: string | string[] | undefined };
  body?: { publicKey?: string; userId?: string };
}): string {
  // Try to get user identifier
  const userId = req.body?.userId || req.body?.publicKey;
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address (from headers in production)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded || 'unknown';
  return `ip:${ip}`;
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Trading endpoints - stricter limits
  trading: {
    maxRequests: 20,
    windowMs: 60000, // 1 minute
  },
  // Token creation - very strict
  tokenCreation: {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
  },
  // General API - moderate
  general: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
  // AI generation - moderate (costly)
  aiGeneration: {
    maxRequests: 30,
    windowMs: 60000, // 1 minute
  },
} as const;

/**
 * Production rate limiter (use Upstash Redis)
 * Uncomment and configure when ready:
 */
/*
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const productionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
*/


