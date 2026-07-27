import { NextRequest, NextResponse } from 'next/server';
import { getAllFileRecords, deleteFileRecord, getFileRecordById } from '@/lib/db';
import { deleteTelegramMessage } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const category = searchParams.get('category') || 'all';

    const { files, total, isMongoUsed } = await getAllFileRecords(search, category);

    // Sanitize records to omit sensitive raw passwords
    const sanitizedFiles = files.map((f) => ({
      id: f.id,
      originalName: f.originalName,
      size: f.size,
      mimeType: f.mimeType,
      telegramChatId: f.telegramChatId,
      telegramMessageId: f.telegramMessageId,
      telegramFileId: f.telegramFileId,
      viewsCount: f.viewsCount || 0,
      downloadsCount: f.downloadsCount || 0,
      isProtected: f.isProtected,
      createdAt: f.createdAt,
    }));

    return NextResponse.json({
      success: true,
      files: sanitizedFiles,
      total,
      isMongoUsed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengambil daftar file.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID File wajib diisi.' }, { status: 400 });
    }

    const file = await getFileRecordById(id);
    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan.' }, { status: 404 });
    }

    // Try deleting message from Telegram channel/chat if available
    if (file.telegramMessageId && file.telegramChatId) {
      await deleteTelegramMessage(file.telegramMessageId, file.telegramChatId);
    }

    // Delete record from database
    const success = await deleteFileRecord(id);

    return NextResponse.json({
      success,
      message: success ? 'File berhasil dihapus dari database & Telegram.' : 'File tidak dapat dihapus.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghapus file.' },
      { status: 500 }
    );
  }
}
