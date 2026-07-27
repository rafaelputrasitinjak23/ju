export type ActiveTab = 'upload' | 'shortener' | 'guide' | 'donation';

export interface FileRecord {
  id: string; // unique short slug (e.g. "x9a2b1c8")
  originalName: string;
  size: number;
  mimeType: string;
  telegramFileId: string;
  telegramUniqueId: string;
  telegramChatId: string;
  telegramMessageId: number;
  viewsCount: number;
  downloadsCount: number;
  isProtected: boolean;
  password?: string;
  createdAt: string;
  expiresAt?: string | null;
  uploaderIp?: string;
}

export interface ShortUrlRecord {
  id: string; // short code or custom alias (e.g., "a1b2c3" or "my-alias")
  targetUrl: string; // target destination URL
  title?: string;
  clicksCount: number;
  createdAt: string;
}

export interface AppConfig {
  telegramBotToken: string;
  telegramChatId: string;
  mongodbUri: string;
}

export interface UploadResponse {
  success: boolean;
  file?: FileRecord;
  fileUrl?: string;
  downloadUrl?: string;
  error?: string;
}
