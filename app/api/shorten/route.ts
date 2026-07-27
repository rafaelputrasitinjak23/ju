import { NextRequest, NextResponse } from 'next/server';
import { saveShortUrl, getShortUrlById, getAllShortUrls, deleteShortUrl } from '@/lib/db';
import { ShortUrlRecord } from '@/lib/types';

function generateShortCode(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { targetUrl, customAlias, title } = body;

    if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.trim()) {
      return NextResponse.json(
        { success: false, error: 'URL Tujuan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    targetUrl = targetUrl.trim();
    // Auto prefix http/https if missing and not relative
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('/')) {
      targetUrl = `https://${targetUrl}`;
    }

    let code = '';
    if (customAlias && typeof customAlias === 'string' && customAlias.trim()) {
      // Clean up alias: only alphanumeric, hyphens, underscores
      code = customAlias.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (!code) {
        return NextResponse.json(
          { success: false, error: 'Custom Alias hanya boleh berupa huruf, angka, dan tanda hubung (-).' },
          { status: 400 }
        );
      }

      const existing = await getShortUrlById(code);
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Custom Alias "${code}" sudah digunakan. Silakan gunakan alias lain.` },
          { status: 400 }
        );
      }
    } else {
      // Generate unique short code
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        code = generateShortCode(6);
        const existing = await getShortUrlById(code);
        if (!existing) isUnique = true;
        attempts++;
      }
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const appUrl = process.env.APP_URL || `${protocol}://${host}`;

    const record: ShortUrlRecord = {
      id: code,
      targetUrl,
      title: title?.trim() || undefined,
      clicksCount: 0,
      createdAt: new Date().toISOString(),
    };

    await saveShortUrl(record);

    const shortUrl = `${appUrl}/s/${code}`;

    return NextResponse.json({
      success: true,
      shortUrl,
      record,
    });
  } catch (err: any) {
    console.error('Shorten API Error:', err);
    return NextResponse.json(
      { success: false, error: `Gagal membuat Short URL: ${err.message || 'Error server'}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const shortUrls = await getAllShortUrls();
    return NextResponse.json({
      success: true,
      shortUrls,
    });
  } catch (err: any) {
    console.error('Fetch Short URLs Error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil daftar Short URL.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID Short URL tidak ditemukan.' },
        { status: 400 }
      );
    }

    const deleted = await deleteShortUrl(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Short URL tidak ditemukan atau gagal dihapus.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Short URL berhasil dihapus.' });
  } catch (err: any) {
    console.error('Delete Short URL Error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus Short URL.' },
      { status: 500 }
    );
  }
}
