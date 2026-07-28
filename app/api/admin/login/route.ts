import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    // Rate limiter check: Max 5 login attempts per minute per IP
    const rateLimit = checkRateLimit(req, {
      identifier: 'admin_login',
      limit: 5,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success && rateLimit.response) {
      return rateLimit.response;
    }

    const body = await req.json();
    const { username, password } = body || {};

    const expectedUsername = process.env.ADMIN_USERNAME || 'RafaelXD';
    const expectedPassword = process.env.ADMIN_PASSWORD || 'Rafael04';

    if (
      username &&
      password &&
      username.trim() === expectedUsername.trim() &&
      password === expectedPassword
    ) {
      return NextResponse.json({ success: true, message: 'Login berhasil' });
    } else {
      return NextResponse.json(
        { success: false, error: 'Username atau kata sandi admin tidak valid.' },
        { status: 401 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan saat login.' },
      { status: 500 }
    );
  }
}
