import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Memory store for tracking request counts per IP & identifier
const ipStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired records every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipStore.entries()) {
      if (now > record.resetTime) {
        ipStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Extracts client IP address from request headers
 */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export interface RateLimitOptions {
  limit?: number; // Maximum allowed requests per window
  windowMs?: number; // Time window duration in milliseconds
  identifier?: string; // Unique key prefix for specific route
}

/**
 * Checks rate limit for an incoming NextRequest.
 * Returns { success: true } or { success: false, response: NextResponse } with HTTP 429 status.
 */
export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  response?: NextResponse;
} {
  const limit = options.limit || 30; // Default: 30 requests
  const windowMs = options.windowMs || 60 * 1000; // Default: 1 minute
  const prefix = options.identifier || 'api';

  const ip = getClientIp(req);
  const key = `${prefix}:${ip}`;
  const now = Date.now();

  let record = ipStore.get(key);

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs,
    };
    ipStore.set(key, record);
  } else {
    record.count += 1;
  }

  const remaining = Math.max(0, limit - record.count);
  const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

  if (record.count > limit) {
    const res = NextResponse.json(
      {
        success: false,
        error: 'Terlalu banyak permintaan (Rate Limit Exceeded). Silakan coba lagi beberapa saat lagi.',
        retryAfter: resetSeconds,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(record.resetTime / 1000).toString(),
          'Retry-After': resetSeconds.toString(),
        },
      }
    );

    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds,
      response: res,
    };
  }

  return {
    success: true,
    limit,
    remaining,
    resetSeconds,
  };
}
