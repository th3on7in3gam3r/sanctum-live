import { NextResponse } from 'next/server';
import { youVersionStatus } from '@/lib/bibleYouVersion';

/**
 * Is YouVersion serving NIV / NKJV to this site? Open in a browser:
 * GET /api/bible/youversion-status
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const bibles = await youVersionStatus();
  return NextResponse.json({ ok: bibles.some((b) => b.ok), bibles }, { headers: { 'Cache-Control': 'no-store' } });
}
