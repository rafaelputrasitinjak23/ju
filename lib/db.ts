import fs from 'fs';
import path from 'path';
import { MongoClient, Collection, Document } from 'mongodb';
import { FileRecord, ShortUrlRecord } from './types';
import { getConfig } from './config';

const DATA_DIR = path.join(process.cwd(), '.data');
const LOCAL_FILES_PATH = path.join(DATA_DIR, 'files.json');
const LOCAL_SHORT_URLS_PATH = path.join(DATA_DIR, 'short_urls.json');

let mongoClient: MongoClient | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getLocalFiles(): FileRecord[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(LOCAL_FILES_PATH)) {
      fs.writeFileSync(LOCAL_FILES_PATH, JSON.stringify([]), 'utf-8');
      return [];
    }
    const content = fs.readFileSync(LOCAL_FILES_PATH, 'utf-8');
    if (!content || !content.trim()) {
      return [];
    }
    return JSON.parse(content) || [];
  } catch (e) {
    console.error('Error reading local files:', e);
    return [];
  }
}

function saveLocalFiles(files: FileRecord[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(LOCAL_FILES_PATH, JSON.stringify(files, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local files:', e);
  }
}

async function getMongoCollection(): Promise<Collection<Document> | null> {
  const { mongodbUri } = getConfig();
  if (!mongodbUri || !mongodbUri.trim()) {
    return null;
  }

  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(mongodbUri, {
        serverSelectionTimeoutMS: 2500,
        connectTimeoutMS: 2500,
      });
      await mongoClient.connect();
    }
    const db = mongoClient.db('telecloud_file_host');
    return db.collection('files');
  } catch (err) {
    console.warn('MongoDB connection warning (falling back to embedded file store):', err);
    mongoClient = null;
    return null;
  }
}

export async function checkMongoConnection(customUri?: string): Promise<{ success: boolean; message: string }> {
  const uri = customUri || getConfig().mongodbUri;
  if (!uri || !uri.trim()) {
    return { success: false, message: 'URI MongoDB belum diisi.' };
  }

  try {
    const tempClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    await tempClient.connect();
    await tempClient.db('telecloud_file_host').command({ ping: 1 });
    await tempClient.close();
    return { success: true, message: 'Koneksi MongoDB Berhasil!' };
  } catch (err: any) {
    return { success: false, message: `Gagal terhubung ke MongoDB: ${err.message || 'Error tidak diketahui'}` };
  }
}

export async function saveFileRecord(file: FileRecord): Promise<void> {
  // Always update local cache
  const local = getLocalFiles();
  const index = local.findIndex((f) => f.id === file.id);
  if (index >= 0) {
    local[index] = file;
  } else {
    local.unshift(file);
  }
  saveLocalFiles(local);

  // Sync to MongoDB if connected
  const col = await getMongoCollection();
  if (col) {
    try {
      await col.updateOne(
        { id: file.id },
        { $set: file },
        { upsert: true }
      );
    } catch (e) {
      console.error('Failed to save record to MongoDB:', e);
    }
  }
}

export async function getFileRecordById(id: string): Promise<FileRecord | null> {
  const col = await getMongoCollection();
  if (col) {
    try {
      const doc = await col.findOne({ id });
      if (doc) {
        const { _id, ...rest } = doc;
        return rest as FileRecord;
      }
    } catch (e) {
      console.error('MongoDB query error, falling back to local file store:', e);
    }
  }

  const local = getLocalFiles();
  return local.find((f) => f.id === id) || null;
}

export async function getAllFileRecords(
  search?: string,
  category?: string
): Promise<{ files: FileRecord[]; total: number; isMongoUsed: boolean }> {
  const col = await getMongoCollection();
  let files: FileRecord[] = [];
  let isMongoUsed = false;

  if (col) {
    try {
      const query: any = {};
      if (search && search.trim()) {
        query.originalName = { $regex: search.trim(), $options: 'i' };
      }
      if (category && category !== 'all') {
        if (category === 'images') query.mimeType = { $regex: '^image/' };
        else if (category === 'videos') query.mimeType = { $regex: '^video/' };
        else if (category === 'audio') query.mimeType = { $regex: '^audio/' };
        else if (category === 'documents') query.mimeType = { $regex: 'pdf|doc|txt|json|csv|rtf|sheet' };
        else if (category === 'archives') query.mimeType = { $regex: 'zip|rar|tar|gz|7z' };
      }

      const docs = await col.find(query).sort({ createdAt: -1 }).toArray();
      files = docs.map((doc) => {
        const { _id, ...rest } = doc;
        return rest as FileRecord;
      });
      isMongoUsed = true;
    } catch (e) {
      console.error('MongoDB fetch error, falling back to local storage:', e);
    }
  }

  if (!isMongoUsed) {
    let local = getLocalFiles();

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      local = local.filter((f) => f.originalName.toLowerCase().includes(q));
    }

    if (category && category !== 'all') {
      if (category === 'images') local = local.filter((f) => f.mimeType.startsWith('image/'));
      else if (category === 'videos') local = local.filter((f) => f.mimeType.startsWith('video/'));
      else if (category === 'audio') local = local.filter((f) => f.mimeType.startsWith('audio/'));
      else if (category === 'documents') local = local.filter((f) => /pdf|doc|txt|json|csv|rtf|sheet/.test(f.mimeType));
      else if (category === 'archives') local = local.filter((f) => /zip|rar|tar|gz|7z/.test(f.mimeType));
    }

    files = local;
  }

  return {
    files,
    total: files.length,
    isMongoUsed,
  };
}

export async function incrementFileStats(id: string, type: 'view' | 'download'): Promise<void> {
  const local = getLocalFiles();
  const file = local.find((f) => f.id === id);
  if (file) {
    if (type === 'view') file.viewsCount = (file.viewsCount || 0) + 1;
    if (type === 'download') file.downloadsCount = (file.downloadsCount || 0) + 1;
    saveLocalFiles(local);
  }

  const col = await getMongoCollection();
  if (col) {
    try {
      const incObj = type === 'view' ? { viewsCount: 1 } : { downloadsCount: 1 };
      await col.updateOne({ id }, { $inc: incObj });
    } catch (e) {
      console.error('Failed to increment stats in Mongo:', e);
    }
  }
}

export async function deleteFileRecord(id: string): Promise<boolean> {
  let deleted = false;
  const local = getLocalFiles();
  const newLocal = local.filter((f) => f.id !== id);
  if (newLocal.length !== local.length) {
    saveLocalFiles(newLocal);
    deleted = true;
  }

  const col = await getMongoCollection();
  if (col) {
    try {
      const res = await col.deleteOne({ id });
      if (res.deletedCount && res.deletedCount > 0) {
        deleted = true;
      }
    } catch (e) {
      console.error('Failed to delete file from Mongo:', e);
    }
  }

  return deleted;
}

/* ========================================================================
 * SHORT URL PERSISTENCE FUNCTIONS
 * ======================================================================== */

function getLocalShortUrls(): ShortUrlRecord[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(LOCAL_SHORT_URLS_PATH)) {
      fs.writeFileSync(LOCAL_SHORT_URLS_PATH, JSON.stringify([]), 'utf-8');
      return [];
    }
    const content = fs.readFileSync(LOCAL_SHORT_URLS_PATH, 'utf-8');
    if (!content || !content.trim()) return [];
    return JSON.parse(content) || [];
  } catch (e) {
    console.error('Error reading local short URLs:', e);
    return [];
  }
}

function saveLocalShortUrls(shortUrls: ShortUrlRecord[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(LOCAL_SHORT_URLS_PATH, JSON.stringify(shortUrls, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving local short URLs:', e);
  }
}

async function getMongoShortUrlsCollection(): Promise<Collection<Document> | null> {
  const { mongodbUri } = getConfig();
  if (!mongodbUri || !mongodbUri.trim()) return null;

  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(mongodbUri, {
        serverSelectionTimeoutMS: 2500,
        connectTimeoutMS: 2500,
      });
      await mongoClient.connect();
    }
    const db = mongoClient.db('telecloud_file_host');
    return db.collection('short_urls');
  } catch (err) {
    mongoClient = null;
    return null;
  }
}

export async function saveShortUrl(record: ShortUrlRecord): Promise<void> {
  const local = getLocalShortUrls();
  const idx = local.findIndex((s) => s.id === record.id);
  if (idx >= 0) {
    local[idx] = record;
  } else {
    local.unshift(record);
  }
  saveLocalShortUrls(local);

  const col = await getMongoShortUrlsCollection();
  if (col) {
    try {
      await col.updateOne({ id: record.id }, { $set: record }, { upsert: true });
    } catch (e) {
      console.error('Failed to save short URL to Mongo:', e);
    }
  }
}

export async function getShortUrlById(id: string): Promise<ShortUrlRecord | null> {
  const col = await getMongoShortUrlsCollection();
  if (col) {
    try {
      const doc = await col.findOne({ id });
      if (doc) {
        const { _id, ...rest } = doc;
        return rest as ShortUrlRecord;
      }
    } catch (e) {
      console.error('Mongo query error for short URL:', e);
    }
  }

  const local = getLocalShortUrls();
  return local.find((s) => s.id === id) || null;
}

export async function getAllShortUrls(): Promise<ShortUrlRecord[]> {
  const col = await getMongoShortUrlsCollection();
  if (col) {
    try {
      const docs = await col.find().sort({ createdAt: -1 }).toArray();
      return docs.map((d) => {
        const { _id, ...rest } = d;
        return rest as ShortUrlRecord;
      });
    } catch (e) {
      console.error('Failed to get short URLs from Mongo:', e);
    }
  }

  return getLocalShortUrls();
}

export async function incrementShortUrlClicks(id: string): Promise<void> {
  const local = getLocalShortUrls();
  const record = local.find((s) => s.id === id);
  if (record) {
    record.clicksCount = (record.clicksCount || 0) + 1;
    saveLocalShortUrls(local);
  }

  const col = await getMongoShortUrlsCollection();
  if (col) {
    try {
      await col.updateOne({ id }, { $inc: { clicksCount: 1 } });
    } catch (e) {
      console.error('Failed to increment short URL clicks in Mongo:', e);
    }
  }
}

export async function deleteShortUrl(id: string): Promise<boolean> {
  let deleted = false;
  const local = getLocalShortUrls();
  const newLocal = local.filter((s) => s.id !== id);
  if (newLocal.length !== local.length) {
    saveLocalShortUrls(newLocal);
    deleted = true;
  }

  const col = await getMongoShortUrlsCollection();
  if (col) {
    try {
      const res = await col.deleteOne({ id });
      if (res.deletedCount && res.deletedCount > 0) {
        deleted = true;
      }
    } catch (e) {
      console.error('Failed to delete short URL from Mongo:', e);
    }
  }

  return deleted;
}

