import { NextResponse } from 'next/server';
import { getBibleChapter, listBibleBooks, listBibleTranslations, versesAsText } from '@/lib/bible';

/**
 * One chapter as plain verse text, for "Compare languages" in the reader.
 * GET /api/bible/chapter?t=lug_bib&b=JOL&c=2
 */
/** Public Bible text: Jordan and Tribes load verse wording from here for "Share to Jordan" / "Post to Tribes". */
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const t = url.searchParams.get('t') || '';
  const b = (url.searchParams.get('b') || '').toUpperCase();
  const c = Number.parseInt(url.searchParams.get('c') || '', 10);
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(t) || !/^[0-9A-Z]{3}$/.test(b) || !Number.isFinite(c) || c < 1 || c > 200) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400, headers: CORS });
  }
  try {
    const translation = (await listBibleTranslations()).find((x) => x.id === t);
    if (!translation) return NextResponse.json({ ok: false, error: 'unknown_translation' }, { status: 404, headers: CORS });
    const book = (await listBibleBooks(t)).find((x) => x.id === b);
    if (!book) return NextResponse.json({ ok: false, error: 'missing_book' }, { status: 404, headers: CORS });
    if (c > book.numberOfChapters) return NextResponse.json({ ok: false, error: 'missing_chapter' }, { status: 404, headers: CORS });
    const chapter = await getBibleChapter(translation, book, c);
    return NextResponse.json(
      {
        ok: true,
        translation: { id: translation.id, name: translation.englishName || translation.name, shortName: translation.shortName, language: translation.language, textDirection: translation.textDirection },
        bookName: book.name,
        chapter: chapter.chapter,
        verses: versesAsText(chapter.content),
      },
      { headers: { ...CORS, 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400' } }
    );
  } catch {
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 502, headers: CORS });
  }
}
