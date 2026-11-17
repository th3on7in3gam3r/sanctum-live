import { NextResponse } from 'next/server';
import { defaultTranslation, languageLabel, listBibleTranslations } from '@/lib/bible';

/**
 * The Bibles the church offers, for other PLCC apps (PLCC Ka Link's Bible page).
 * GET /api/bible/translations
 */
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  try {
    const all = await listBibleTranslations();
    const translations = all.map((t) => ({
      id: t.id,
      name: t.name,
      englishName: t.englishName,
      shortName: t.shortName,
      language: t.language,
      languageLabel: languageLabel(t.language),
      textDirection: t.textDirection,
      numberOfBooks: t.numberOfBooks,
      licenseNotice: t.licenseNotice,
      source: t.source ?? null,
    }));
    const english = defaultTranslation(all)?.id ?? null;
    const luganda = all.find((t) => t.language === 'lug')?.id ?? null;
    return NextResponse.json(
      { ok: true, translations, defaults: { english, luganda } },
      { headers: { ...CORS, 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' } }
    );
  } catch {
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 502, headers: CORS });
  }
}
