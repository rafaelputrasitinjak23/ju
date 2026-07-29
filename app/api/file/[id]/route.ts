import { NextRequest, NextResponse } from 'next/server';
import { getFileRecordById, incrementFileStats } from '@/lib/db';
import { getAppBaseUrl } from '@/lib/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const file = await getFileRecordById(id);

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan.' }, { status: 404 });
    }

    // Increment view count
    await incrementFileStats(id, 'view');

    const appUrl = getAppBaseUrl(req);

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        telegramChatId: file.telegramChatId,
        telegramMessageId: file.telegramMessageId,
        telegramFileId: file.telegramFileId,
        viewsCount: (file.viewsCount || 0) + 1,
        downloadsCount: file.downloadsCount || 0,
        isProtected: file.isProtected,
        createdAt: file.createdAt,
        rawUrl: `/api/raw/${file.id}`,
        downloadUrl: `/api/raw/${file.id}?download=true`,
        fullShareUrl: `${appUrl}/f/${file.id}`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan server.' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const inputPassword = body?.password || '';

    const file = await getFileRecordById(id);
    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan.' }, { status: 404 });
    }

    if (file.isProtected && file.password !== inputPassword) {
      return NextResponse.json({ success: false, error: 'Password file salah!' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      unlocked: true,
      rawUrl: `/api/raw/${file.id}`,
      downloadUrl: `/api/raw/${file.id}?download=true`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memverifikasi password.' },
      { status: 500 }
    );
  }
}
