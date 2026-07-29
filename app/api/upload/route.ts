import { NextRequest, NextResponse } from 'next/server';
import { sendFileToTelegram } from '@/lib/telegram';
import { saveFileRecord } from '@/lib/db';
import { FileRecord } from '@/lib/types';
import { checkRateLimit } from '@/lib/rateLimiter';
import { getAppBaseUrl } from '@/lib/utils';

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
    // Rate limiter check: Max 10 uploads per minute per IP
    const rateLimit = checkRateLimit(req, {
      identifier: 'upload',
      limit: 10,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success && rateLimit.response) {
      return rateLimit.response;
    }

    const formData = await req.formData();
    const rawFile = formData.get('file');
    const password = (formData.get('password') as string) || '';

    if (!rawFile) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan dalam form upload.' }, { status: 400 });
    }

    // Check if rawFile is a string (e.g. developer passed path string or text instead of File/Blob object)
    if (typeof rawFile === 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Input file berupa string/teks path, bukan konten file binary. Jika dari Node.js/Script JS, baca file dengan fs.readFileSync(filePath) lalu bungkus dengan new Blob([buffer]) sebelum di-append ke FormData.',
        },
        { status: 400 }
      );
    }

    const file = rawFile as File;

    const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
    if (file.size && file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file melebihi batas maksimal 200MB.' },
        { status: 400 }
      );
    }

    // Safely extract Buffer from file / blob
    let buffer: Buffer;
    if (typeof (file as any).arrayBuffer === 'function') {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (Buffer.isBuffer(file)) {
      buffer = file as Buffer;
    } else if (file instanceof ArrayBuffer) {
      buffer = Buffer.from(file);
    } else if (file instanceof Uint8Array) {
      buffer = Buffer.from(file.buffer, file.byteOffset, file.byteLength);
    } else if (typeof (file as any).stream === 'function') {
      const chunks: Uint8Array[] = [];
      const reader = (file as any).stream().getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      buffer = Buffer.concat(chunks);
    } else if ((file as any).buffer && (file as any).buffer instanceof ArrayBuffer) {
      buffer = Buffer.from((file as any).buffer);
    } else {
      return NextResponse.json(
        { success: false, error: 'Format file tidak dapat dibaca oleh server (tidak memiliki arrayBuffer/stream/buffer).' },
        { status: 400 }
      );
    }

    const fileName = file.name || 'uploaded_file';
    const fileType = file.type || 'application/octet-stream';

    // 1. Send file to Telegram Chat via Bot API
    const telegramRes = await sendFileToTelegram(buffer, fileName, fileType);

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
      originalName: file.name || fileName,
      size: file.size || buffer.length,
      mimeType: file.type || fileType,
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

    const appUrl = getAppBaseUrl(req);
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
