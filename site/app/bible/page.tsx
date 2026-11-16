import type { Metadata } from 'next';
import Link from 'next/link';
import { BibleReader } from '@/components/bible/BibleReader';
import { PageHero } from '@/components/page/PageHero';
import { getDictionary } from '@/lib/locale';
import { LOCALE_BIBLE_LANGUAGE, type Locale } from '@/lib/i18n';
import {
  BIBLE_LANGUAGES,
  defaultTranslation,
  getBibleChapter,
  languageLabel,
  listBibleBooks,
  listBibleTranslations,
  type BibleBook,
  type BibleChapter,
} from '@/lib/bible';

type Search = { searchParams: Promise<{ t?: string; b?: string; c?: string; v?: string }> };

export async function generateMetadata({ searchParams }: Search): Promise<Metadata> {
  const { b, c } = await searchParams;
  const ref = b ? ` · ${b} ${c || 1}` : '';
  return {
    title: `Bible${ref}`,
    description: 'Read the Bible in Luganda, Kiswahili, English, French, Spanish and more at Promised Land Christian Center.',
  };
}

type Resolved = {
  chapter: BibleChapter;
  books: BibleBook[];
  translations: Awaited<ReturnType<typeof listBibleTranslations>>;
  usedDefaults: boolean;
};

async function resolve(params: { t?: string; b?: string; c?: string }, locale: Locale): Promise<Resolved> {
  const translations = await listBibleTranslations();
  // No translation in the link: open in the visitor's site language when the Bible exists in it.
  const preferred =
    locale === 'en' ? undefined : translations.find((t) => t.language === LOCALE_BIBLE_LANGUAGE[locale] && t.numberOfBooks >= 66);
  const translation = translations.find((t) => t.id === params.t) ?? preferred ?? defaultTranslation(translations);
  if (!translation) throw new Error('No Bible translations are available right now.');
  const books = await listBibleBooks(translation.id);
  // Keep the same book when switching translations; fall back if this translation lacks it (e.g. NT only).
  const book =
    books.find((x) => x.id === (params.b || '').toUpperCase()) ??
    books.find((x) => x.id === 'JHN') ??
    books[0];
  if (!book) throw new Error('This translation has no books available.');
  const requested = Number.parseInt(params.c || '1', 10);
  const chapterNumber = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), book.numberOfChapters) : 1;
  const chapter = await getBibleChapter(translation, book, chapterNumber);
  return { chapter, books, translations, usedDefaults: !params.t && !params.b };
}

export default async function BiblePage({ searchParams }: Search) {
  const params = await searchParams;
  const { locale, t } = await getDictionary();
  let data: Resolved | null = null;
  let failure = '';
  try {
    data = await resolve(params, locale);
  } catch (error) {
    failure = error instanceof Error ? error.message : 'The Bible is unavailable right now.';
  }

  const presentLanguages = data
    ? BIBLE_LANGUAGES.filter(
        (lang, index, all) =>
          data!.translations.some((t) => t.language === lang.code) &&
          all.findIndex((x) => x.label === lang.label) === index
      ).map((lang) => ({ code: lang.code, label: languageLabel(lang.code) }))
    : [];
  const parsedVerse = Number.parseInt(params.v || '', 10);
  const verse = Number.isFinite(parsedVerse) && parsedVerse > 0 && parsedVerse < 200 ? parsedVerse : undefined;

  return (
    <>
      <PageHero
        variant="centered"
        eyebrow={t.bible.eyebrow}
        title={t.bible.title}
        lede={locale === 'en' ? 'One Word. Many languages. A daily walk with God.' : t.bible.ledeShort}
      />
      <section className="bg-cream px-4 pb-24 pt-8 text-ink sm:px-6 min-[900px]:-mt-10">
        <div className="relative">
          {data ? (
            <BibleReader
              chapter={data.chapter}
              books={data.books}
              translations={data.translations.map((x) => ({
                id: x.id,
                name: x.name,
                englishName: x.englishName,
                shortName: x.shortName,
                language: x.language,
                textDirection: x.textDirection,
              }))}
              languages={presentLanguages}
              labels={{
                language: t.bible.language,
                translation: t.bible.translation,
                book: t.bible.book,
                chapter: t.bible.chapter,
              }}
              usedDefaults={data.usedDefaults}
              initialVerse={verse}
            />
          ) : (
            <div className="mx-auto max-w-xl rounded-3xl border border-ink/10 bg-white p-8 text-center">
              <p className="font-display text-2xl text-forest-800">{t.bible.resting}</p>
              <p className="mt-2 text-ink/70">{failure} {t.bible.later}</p>
              <Link href="/bible" className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-forest-800 px-6 font-bold text-cream">
                {t.bible.tryAgain}
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
