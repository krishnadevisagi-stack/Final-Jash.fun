import { NextRequest } from 'next/server';

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired IP entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const ip in store) {
      if (store[ip].resetTime < now) {
        delete store[ip];
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Gets a configurable rate limit threshold from environment variables or falls back to standard default.
 */
export function getEnvLimit(envKey: string, fallback: number): number {
  const envVal = process.env[envKey];
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

export function checkRateLimit(
  req: NextRequest, 
  limit: number = 30, 
  windowMs: number = 60 * 1000
): { isRateLimited: boolean; remaining: number } {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
  const now = Date.now();

  if (!store[ip] || store[ip].resetTime < now) {
    store[ip] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return { isRateLimited: false, remaining: limit - 1 };
  }

  store[ip].count += 1;

  if (store[ip].count > limit) {
    return { isRateLimited: true, remaining: 0 };
  }

  return { isRateLimited: false, remaining: limit - store[ip].count };
}
