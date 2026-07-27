import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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

