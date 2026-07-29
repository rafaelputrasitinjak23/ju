import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextRequest } from "next/server"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function parseJsonResponse<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text || !text.trim()) {
    throw new Error(`Respon server kosong (HTTP ${res.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.substring(0, 80).replace(/\s+/g, ' ');
    throw new Error(`Respon server bukan JSON valid (HTTP ${res.status}): "${preview}"`);
  }
}

export function getAppBaseUrl(req?: NextRequest | Request): string {
  const envUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  if (envUrl && envUrl !== 'MY_APP_URL' && envUrl.startsWith('http')) {
    return envUrl.replace(/\/$/, '');
  }

  if (req) {
    const headers = req.headers;
    const host = headers.get('x-forwarded-host') || headers.get('host') || 'localhost:3000';
    const proto = headers.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3000';
}

export function sanitizeAppUrl(url: string | undefined | null): string {
  if (!url) return '';
  let result = url;
  if (result.includes('MY_APP_URL')) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    result = result.replace(/MY_APP_URL/g, origin);
  }
  return result;
}


