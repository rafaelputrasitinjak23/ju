import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';

export function middleware(req: NextRequest) {
  // Apply general rate limit protection for all API endpoints
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const rateLimit = checkRateLimit(req, {
      identifier: 'global_api',
      limit: 60,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success && rateLimit.response) {
      return rateLimit.response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
