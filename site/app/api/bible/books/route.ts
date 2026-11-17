import { NextResponse } from 'next/server';
import { listBibleBooks, listBibleTranslations } from '@/lib/bible';

/**
 * The books of one Bible, for other PLCC apps (PLCC Ka Link's Bible page).
 * GET /api/bible/books?t=lug_lcb
 */
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get('t') || '';
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(t)) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400, headers: CORS });
  try {
    if (!(await listBibleTranslations()).some((x) => x.id === t)) {
      return NextResponse.json({ ok: false, error: 'unknown_translation' }, { status: 404, headers: CORS });
    }
    const books = (await listBibleBooks(t)).map((b) => ({ id: b.id, name: b.name, numberOfChapters: b.numberOfChapters }));
    return NextResponse.json(
      { ok: true, books },
      { headers: { ...CORS, 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400' } }
    );
  } catch {
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 502, headers: CORS });
  }
}
