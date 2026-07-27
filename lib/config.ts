import fs from 'fs';
import path from 'path';
import { AppConfig } from './types';

const CONFIG_FILE_PATH = path.join(process.cwd(), '.data', 'config.json');

function ensureDataDir() {
  const dir = path.join(process.cwd(), '.data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getConfig(): AppConfig {
  let savedConfig: Partial<AppConfig> = {};
  
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const content = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      if (content && content.trim()) {
        savedConfig = JSON.parse(content);
      }
    }
  } catch (err) {
    console.error('Failed to read config file:', err);
  }

  const telegramBotToken =
    process.env.TELEGRAM_BOT_TOKEN ||
    savedConfig.telegramBotToken ||
    '';

  const telegramChatId =
    process.env.TELEGRAM_CHAT_ID ||
    savedConfig.telegramChatId ||
    '';

  const mongodbUri =
    process.env.MONGODB_URI ||
    savedConfig.mongodbUri ||
    '';

  return {
    telegramBotToken,
    telegramChatId,
    mongodbUri,
  };
}

export function saveConfig(newConfig: Partial<AppConfig>): AppConfig {
  ensureDataDir();
  const current = getConfig();
  const updated: AppConfig = {
    ...current,
    ...newConfig,
  };

  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save config file:', err);
  }

  return updated;
}
