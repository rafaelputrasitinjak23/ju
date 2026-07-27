import { NextRequest, NextResponse } from 'next/server';
import { getShortUrlById, incrementShortUrlClicks, getFileRecordById, incrementFileStats } from '@/lib/db';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;

    if (!id) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // 1. Check if ID exists in Short URL database
    const shortRecord = await getShortUrlById(id);
    if (shortRecord) {
      await incrementShortUrlClicks(id);
      let destination = shortRecord.targetUrl;

      // Ensure destination is a valid absolute or relative URL
      if (!destination.startsWith('http://') && !destination.startsWith('https://') && !destination.startsWith('/')) {
        destination = `https://${destination}`;
      }

      if (destination.startsWith('/')) {
        destination = new URL(destination, req.url).toString();
      }

      return NextResponse.redirect(destination, 307);
    }

    // 2. Fallback: Check if ID matches a FileRecord ID directly
    const fileRecord = await getFileRecordById(id);
    if (fileRecord) {
      await incrementFileStats(id, 'view');
      const isDownload = req.nextUrl.searchParams.get('download') === 'true';
      if (isDownload) {
        return NextResponse.redirect(new URL(`/api/raw/${id}?download=true`, req.url), 307);
      }
      return NextResponse.redirect(new URL(`/f/${id}`, req.url), 307);
    }

    // 3. Not found -> Redirect to home page
    return NextResponse.redirect(new URL('/', req.url));
  } catch (err) {
    console.error('Short URL Redirect Error:', err);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
