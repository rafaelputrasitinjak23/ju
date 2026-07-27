import { NextRequest, NextResponse } from 'next/server';
import { getConfig, saveConfig } from '@/lib/config';
import { testTelegramBot } from '@/lib/telegram';
import { checkMongoConnection } from '@/lib/db';

function maskToken(token: string): string {
  if (!token || token.length < 10) return token ? '***' : '';
  return token.substring(0, 6) + '...' + token.substring(token.length - 4);
}

function maskMongoUri(uri: string): string {
  if (!uri) return '';
  return uri.replace(/:([^@]+)@/, ':****@');
}

export async function GET() {
  try {
    const config = getConfig();

    let telegramStatus: any = { ok: false, error: 'Belum dikonfigurasi' };
    let mongoStatus: any = { success: false, message: 'Belum dikonfigurasi' };

    if (config.telegramBotToken) {
      try {
        telegramStatus = await testTelegramBot();
      } catch (e: any) {
        telegramStatus = { ok: false, error: e.message || 'Gagal memeriksa status Telegram' };
      }
    }

    if (config.mongodbUri) {
      try {
        mongoStatus = await checkMongoConnection();
      } catch (e: any) {
        mongoStatus = { success: false, message: e.message || 'Gagal memeriksa status MongoDB' };
      }
    }

    return NextResponse.json({
      success: true,
      config: {
        telegramBotTokenMasked: maskToken(config.telegramBotToken),
        hasTelegramToken: !!config.telegramBotToken,
        telegramChatId: config.telegramChatId,
        hasTelegramChatId: !!config.telegramChatId,
        mongodbUriMasked: maskMongoUri(config.mongodbUri),
        hasMongodbUri: !!config.mongodbUri,
      },
      status: {
        telegram: telegramStatus,
        mongodb: mongoStatus,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Gagal membaca pengaturan',
        config: {
          telegramBotTokenMasked: '',
          hasTelegramToken: false,
          telegramChatId: '',
          hasTelegramChatId: false,
          mongodbUriMasked: '',
          hasMongodbUri: false,
        },
        status: {
          telegram: { ok: false, error: 'Error server' },
          mongodb: { success: false, message: 'Error server' },
        },
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, telegramBotToken, telegramChatId, mongodbUri } = body;

    if (action === 'test_telegram') {
      const result = await testTelegramBot(telegramBotToken, telegramChatId);
      return NextResponse.json(result);
    }

    if (action === 'test_mongodb') {
      const result = await checkMongoConnection(mongodbUri);
      return NextResponse.json(result);
    }

    if (action === 'save') {
      const current = getConfig();
      const updatedConfig: any = {};

      if (telegramBotToken !== undefined) {
        // If provided non-masked or new value, save it
        if (!telegramBotToken.includes('...')) {
          updatedConfig.telegramBotToken = telegramBotToken.trim();
        }
      }
      if (telegramChatId !== undefined) {
        updatedConfig.telegramChatId = telegramChatId.trim();
      }
      if (mongodbUri !== undefined) {
        if (!mongodbUri.includes(':****@')) {
          updatedConfig.mongodbUri = mongodbUri.trim();
        }
      }

      saveConfig(updatedConfig);

      // Re-verify after saving
      const newTelegramStatus = await testTelegramBot();
      const newMongoStatus = await checkMongoConnection();

      return NextResponse.json({
        success: true,
        message: 'Pengaturan berhasil disimpan!',
        status: {
          telegram: newTelegramStatus,
          mongodb: newMongoStatus,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
