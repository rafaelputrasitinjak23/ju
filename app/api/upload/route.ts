import { NextRequest, NextResponse } from 'next/server';
import { sendFileToTelegram } from '@/lib/telegram';
import { saveFileRecord } from '@/lib/db';
import { FileRecord } from '@/lib/types';

// Simple nano ID generator
function generateShortId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const password = (formData.get('password') as string) || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan dalam form upload.' }, { status: 400 });
    }

    const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file melebihi batas maksimal 200MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Send file to Telegram Chat via Bot API
    const telegramRes = await sendFileToTelegram(buffer, file.name, file.type);

    if (!telegramRes.ok || !telegramRes.file_id) {
      return NextResponse.json(
        {
          success: false,
          error: telegramRes.error || 'Gagal mengirimkan file ke penyimpanan Telegram.',
        },
        { status: 500 }
      );
    }

    // 2. Prepare metadata record for MongoDB / Database storage
    const fileSlug = generateShortId(8);
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    const fileRecord: FileRecord = {
      id: fileSlug,
      originalName: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      telegramFileId: telegramRes.file_id,
      telegramUniqueId: telegramRes.file_unique_id || '',
      telegramChatId: telegramRes.chat_id || '',
      telegramMessageId: telegramRes.message_id || 0,
      viewsCount: 0,
      downloadsCount: 0,
      isProtected: !!password.trim(),
      password: password.trim() || undefined,
      createdAt: new Date().toISOString(),
      uploaderIp: clientIp,
    };

    // 3. Save to Database (MongoDB + Local Fallback)
    await saveFileRecord(fileRecord);

    const appUrl = process.env.APP_URL || '';
    const shareUrl = `${appUrl}/f/${fileSlug}`;
    const directDownloadUrl = `${appUrl}/api/raw/${fileSlug}?download=true`;

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        originalName: fileRecord.originalName,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType,
        telegramChatId: fileRecord.telegramChatId,
        telegramMessageId: fileRecord.telegramMessageId,
        createdAt: fileRecord.createdAt,
        isProtected: fileRecord.isProtected,
      },
      fileUrl: shareUrl,
      downloadUrl: directDownloadUrl,
    });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: `Kesalahan server: ${err.message || 'Gagal memproses file'}`,
      },
      { status: 500 }
    );
  }
}
