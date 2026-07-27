import { getConfig } from './config';
import { parseJsonResponse } from './utils';

export interface TelegramUploadResult {
  ok: boolean;
  file_id?: string;
  file_unique_id?: string;
  file_size?: number;
  message_id?: number;
  chat_id?: string;
  error?: string;
}

export async function testTelegramBot(
  tokenOverride?: string,
  chatIdOverride?: string
): Promise<{ ok: boolean; botUsername?: string; botName?: string; error?: string }> {
  const { telegramBotToken, telegramChatId } = getConfig();
  const token = tokenOverride || telegramBotToken;
  const chatId = chatIdOverride || telegramChatId;

  if (!token) {
    return { ok: false, error: 'Telegram Bot Token belum diisi.' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3500),
    });
    const data = await parseJsonResponse(res);

    if (!data.ok) {
      return { ok: false, error: data.description || 'Token Bot Telegram tidak valid.' };
    }

    const botUsername = data.result?.username;
    const botName = data.result?.first_name;

    if (chatId) {
      // Test chat access using getChat (silent check without sending notification messages to chat)
      const chatRes = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${chatId}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3500),
      });
      const chatData = await parseJsonResponse(chatRes);
      if (!chatData.ok) {
        return {
          ok: false,
          botUsername,
          botName,
          error: `Bot aktif, namun gagal terhubung ke Chat ID (${chatId}): ${chatData.description}`,
        };
      }
    }

    return { ok: true, botUsername, botName };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Gagal menghubungi Telegram API.' };
  }
}

export async function sendFileToTelegram(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<TelegramUploadResult> {
  const { telegramBotToken, telegramChatId } = getConfig();

  if (!telegramBotToken || !telegramChatId) {
    return {
      ok: false,
      error: 'Pengaturan Telegram Bot Token atau Chat ID belum dikonfigurasi di server.',
    };
  }

  try {
    const formData = new FormData();
    formData.append('chat_id', telegramChatId);
    formData.append('disable_notification', 'true');

    // Convert Buffer to Uint8Array for Blob compatibility
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType || 'application/octet-stream' });
    formData.append('document', blob, fileName);

    const caption = `📂 *TeleCloud Upload*\n📄 *File:* \`${fileName}\`\n⚡ *Uploaded:* ${new Date().toLocaleString('id-ID')}`;
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');

    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendDocument`, {
      method: 'POST',
      body: formData,
    });

    const data = await parseJsonResponse(response);

    if (!data.ok) {
      return {
        ok: false,
        error: `Telegram API Error: ${data.description || 'Gagal mengunggah file.'}`,
      };
    }

    const doc = data.result?.document || data.result?.photo?.[data.result?.photo.length - 1] || data.result?.video || data.result?.audio;

    if (!doc || !doc.file_id) {
      return {
        ok: false,
        error: 'Telegram tidak mengembalikan file_id yang valid.',
      };
    }

    return {
      ok: true,
      file_id: doc.file_id,
      file_unique_id: doc.file_unique_id || '',
      file_size: doc.file_size || fileBuffer.length,
      message_id: data.result?.message_id,
      chat_id: String(data.result?.chat?.id || telegramChatId),
    };
  } catch (err: any) {
    return {
      ok: false,
      error: `Error saat mengunggah ke Telegram: ${err.message || 'Kesalahan jaringan'}`,
    };
  }
}

export async function getTelegramFilePath(fileId: string): Promise<{ ok: boolean; downloadUrl?: string; filePath?: string; error?: string }> {
  const { telegramBotToken } = getConfig();

  if (!telegramBotToken) {
    return { ok: false, error: 'Telegram Bot Token tidak dikonfigurasi.' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${fileId}`);
    const data = await parseJsonResponse(res);

    if (!data.ok || !data.result?.file_path) {
      return { ok: false, error: data.description || 'File tidak ditemukan di Telegram Server.' };
    }

    const filePath = data.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${telegramBotToken}/${filePath}`;

    return { ok: true, downloadUrl, filePath };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Gagal mengambil lokasi file Telegram.' };
  }
}

export async function deleteTelegramMessage(messageId: number, chatId: string): Promise<boolean> {
  const { telegramBotToken } = getConfig();
  if (!telegramBotToken || !messageId || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${telegramBotToken}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
      }),
    });
    const data = await parseJsonResponse(res);
    return !!data.ok;
  } catch {
    return false;
  }
}

