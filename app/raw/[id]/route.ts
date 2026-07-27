import { NextRequest, NextResponse } from 'next/server';
import { GET as rawGet, HEAD as rawHead, OPTIONS as rawOptions } from '@/app/api/raw/[id]/route';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  return rawGet(req, props);
}

export async function HEAD(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  return rawHead(req, props);
}

export async function OPTIONS() {
  return rawOptions();
}
