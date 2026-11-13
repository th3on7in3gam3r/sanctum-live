import type { Metadata } from 'next';
import Link from 'next/link';
import { BiblePicker } from '@/components/bible/BiblePicker';
import { ChapterText } from '@/components/bible/ChapterText';
import { PageHero } from '@/components/page/PageHero';
import {
  BIBLE_LANGUAGES,
  bibleHref,
  defaultTranslation,
  getBibleChapter,
  languageLabel,
  listBibleBooks,
  listBibleTranslations,
  type BibleBook,
  type BibleChapter,
} from '@/lib/bible';

type Search = { searchParams: Promise<{ t?: string; b?: string; c?: string }> };

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

async function resolve(params: { t?: string; b?: string; c?: string }): Promise<Resolved> {
  const translations = await listBibleTranslations();
  const translation = translations.find((t) => t.id === params.t) ?? defaultTranslation(translations);
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

function chapterLink(
  target: { book: string; chapter: number } | null,
  books: BibleBook[],
  translationId: string,
  dir: 'prev' | 'next'
) {
  if (!target) return <span />;
  const name = books.find((b) => b.id === target.book)?.name ?? target.book;
  return (
    <Link
      href={bibleHref(translationId, target.book, target.chapter)}
      className={`inline-flex min-h-[48px] items-center gap-2 rounded-full border border-ink/15 bg-white px-5 text-[15px] font-bold text-ink hover:border-forest-800 ${dir === 'next' ? 'justify-self-end' : ''}`}
    >
      {dir === 'prev' ? <span aria-hidden="true">←</span> : null}
      <span>
        {name} {target.chapter}
      </span>
      {dir === 'next' ? <span aria-hidden="true">→</span> : null}
    </Link>
  );
}

export default async function BiblePage({ searchParams }: Search) {
  const params = await searchParams;
  let data: Resolved | null = null;
  let failure = '';
  try {
    data = await resolve(params);
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
  const languageNames = presentLanguages.map((l) => l.label.split(' · ')[0]).slice(0, 5).join(', ');

  return (
    <>
      <PageHero
        variant="centered"
        eyebrow="The Bible"
        title="Read the Word"
        lede={
          languageNames
            ? `Read the Scriptures in ${languageNames} and more, wherever you are.`
            : 'Read the Scriptures in your language, wherever you are.'
        }
      />
      <section className="bg-cream px-4 pb-20 pt-10 text-ink sm:px-6">
        <div className="mx-auto max-w-5xl">
          {data ? (
            <>
              <div className="rounded-3xl border border-ink/10 bg-cream-50 p-4 sm:p-5">
                <BiblePicker
                  languages={presentLanguages}
                  translations={data.translations.map((t) => ({
                    id: t.id,
                    name: t.name,
                    shortName: t.shortName,
                    language: t.language,
                  }))}
                  books={data.books}
                  translationId={data.chapter.translation.id}
                  bookId={data.chapter.book.id}
                  chapter={data.chapter.chapter}
                  usedDefaults={data.usedDefaults}
                />
              </div>

              <article
                className="mx-auto mt-10 max-w-2xl"
                dir={data.chapter.translation.textDirection}
                lang={data.chapter.translation.language}
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-text">{data.chapter.translation.name}</p>
                <h2 className="font-display mt-2 text-[44px] leading-tight text-forest-800">
                  {data.chapter.book.name} {data.chapter.chapter}
                </h2>
                <div className="mt-6">
                  <ChapterText
                    content={data.chapter.content}
                    footnoteCallers={
                      new Map(
                        data.chapter.footnotes.map((note, i) => [
                          note.noteId,
                          note.caller && note.caller !== '+' ? note.caller : String.fromCharCode(97 + (i % 26)),
                        ])
                      )
                    }
                  />
                </div>

                {data.chapter.footnotes.length ? (
                  <aside className="mt-8 border-t border-ink/10 pt-5" aria-label="Footnotes">
                    <ol className="space-y-1.5 text-sm text-ink/70">
                      {data.chapter.footnotes.map((note, i) => (
                        <li key={note.noteId} id={`note-${note.noteId}`} className="scroll-mt-28">
                          <span className="mr-1.5 font-bold text-gold-text">
                            {note.caller && note.caller !== '+' ? note.caller : String.fromCharCode(97 + (i % 26))}
                          </span>
                          {note.verse ? <span className="mr-1">{note.verse}:</span> : null}
                          {note.text}
                        </li>
                      ))}
                    </ol>
                  </aside>
                ) : null}
              </article>

              <nav className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-3" aria-label="Chapters">
                {chapterLink(data.chapter.previous, data.books, data.chapter.translation.id, 'prev')}
                {chapterLink(data.chapter.next, data.books, data.chapter.translation.id, 'next')}
              </nav>

              <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-ink/55">
                {data.chapter.translation.licenseNotice ? `${data.chapter.translation.licenseNotice} ` : ''}
                Text courtesy of the{' '}
                <a href="https://bible.helloao.org" className="underline" rel="noopener" target="_blank">
                  Free Use Bible API
                </a>
                .
              </p>
            </>
          ) : (
            <div className="mx-auto max-w-xl rounded-3xl border border-ink/10 bg-white p-8 text-center">
              <p className="font-display text-2xl text-forest-800">The Bible is resting for a moment.</p>
              <p className="mt-2 text-ink/70">{failure} Please try again shortly.</p>
              <Link href="/bible" className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-forest-800 px-6 font-bold text-cream">
                Try again
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
