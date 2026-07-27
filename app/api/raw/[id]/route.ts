import { NextRequest, NextResponse } from 'next/server';
import { getFileRecordById, incrementFileStats } from '@/lib/db';
import { getTelegramFilePath } from '@/lib/telegram';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Content-Disposition, Accept-Ranges',
  'Accept-Ranges': 'bytes',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function HEAD(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    let cleanId = rawId;
    let file = await getFileRecordById(cleanId);
    if (!file && cleanId.includes('.')) {
      cleanId = cleanId.substring(0, cleanId.lastIndexOf('.'));
      file = await getFileRecordById(cleanId);
    }

    if (!file) {
      return new NextResponse(null, { status: 404, headers: CORS_HEADERS });
    }

    const headers = new Headers({
      ...CORS_HEADERS,
      'Content-Type': file.mimeType || 'application/octet-stream',
      'Content-Length': String(file.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    return new NextResponse(null, { status: 200, headers });
  } catch {
    return new NextResponse(null, { status: 500, headers: CORS_HEADERS });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const { searchParams } = new URL(req.url);
    const forceDownload = searchParams.get('download') === 'true';
    const pwd = searchParams.get('pwd') || '';

    // Gracefully handle id with extensions, e.g. "xyz123.jpg" -> "xyz123"
    let cleanId = rawId;
    let file = await getFileRecordById(cleanId);
    if (!file && cleanId.includes('.')) {
      cleanId = cleanId.substring(0, cleanId.lastIndexOf('.'));
      file = await getFileRecordById(cleanId);
    }

    if (!file) {
      return new NextResponse('File tidak ditemukan.', { status: 404, headers: CORS_HEADERS });
    }

    if (file.isProtected && file.password && file.password !== pwd) {
      return new NextResponse('File dilindungi password. Silakan masukkan password di halaman file.', {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    // Retrieve file location from Telegram Bot API
    const telegramFileRes = await getTelegramFilePath(file.telegramFileId);
    if (!telegramFileRes.ok || !telegramFileRes.downloadUrl) {
      return new NextResponse(
        `Gagal mengambil file dari Telegram Storage: ${telegramFileRes.error || 'File tidak ditemukan di Telegram.'}`,
        { status: 502, headers: CORS_HEADERS }
      );
    }

    // Fetch stream from Telegram CDN URL
    const fileStreamResponse = await fetch(telegramFileRes.downloadUrl);

    if (!fileStreamResponse.ok || !fileStreamResponse.body) {
      return new NextResponse('Gagal membaca stream file dari Telegram server.', { status: 502, headers: CORS_HEADERS });
    }

    // Increment download counter
    await incrementFileStats(cleanId, 'download');

    // Build standard response headers for direct embedding & cross-origin GET
    const headers = new Headers();
    Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));

    headers.set('Content-Type', file.mimeType || 'application/octet-stream');
    headers.set('Content-Length', String(file.size));
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    if (forceDownload) {
      // Force download attachment
      const encodedFilename = encodeURIComponent(file.originalName);
      headers.set('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    } else {
      // Inline viewing for images, video, pdf, text, audio on any website
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    }

    return new NextResponse(fileStreamResponse.body as any, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error('Raw File Stream Error:', err);
    return new NextResponse(`Server Error: ${err.message || 'Gagal memproses file'}`, { status: 500, headers: CORS_HEADERS });
  }
}

