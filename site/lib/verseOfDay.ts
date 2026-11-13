import {
  bibleHref,
  defaultTranslation,
  getBibleChapter,
  listBibleBooks,
  listBibleTranslations,
  type BibleTranslation,
} from './bible';
import { LOCALE_BIBLE_LANGUAGE, type Locale } from './i18n';

/** Well-loved verses, one per day in turn (by the date in Kampala). */
const VERSES: [book: string, chapter: number, verse: number][] = [
  ['JHN', 3, 16], ['PSA', 23, 1], ['PHP', 4, 13], ['JER', 29, 11], ['PRO', 3, 5], ['ISA', 40, 31], ['ROM', 8, 28],
  ['MAT', 11, 28], ['JOS', 1, 9], ['PSA', 46, 1], ['2CO', 5, 17], ['PHP', 4, 6], ['ROM', 12, 2], ['HEB', 11, 1],
  ['GAL', 2, 20], ['EPH', 2, 8], ['1PE', 5, 7], ['PSA', 119, 105], ['MAT', 6, 33], ['ROM', 15, 13], ['ISA', 41, 10],
  ['JHN', 14, 6], ['PSA', 37, 4], ['2TI', 1, 7], ['1CO', 13, 4], ['JAS', 1, 5], ['PSA', 91, 1], ['LAM', 3, 22],
  ['MAT', 5, 16], ['JHN', 16, 33], ['ROM', 5, 8], ['PSA', 27, 1], ['ISA', 26, 3], ['DEU', 31, 6], ['NUM', 6, 24],
  ['PSA', 34, 8], ['JHN', 10, 10], ['COL', 3, 23], ['1JN', 1, 9], ['PRO', 18, 10], ['MIC', 6, 8], ['PSA', 121, 2],
  ['ACT', 1, 8], ['ISA', 53, 5], ['JHN', 15, 5], ['MAT', 28, 19], ['HEB', 13, 8], ['ROM', 10, 9], ['PSA', 139, 14],
  ['2CH', 7, 14], ['EPH', 3, 20], ['PHP', 1, 6], ['ZEP', 3, 17], ['JOL', 2, 28], ['ROM', 8, 37], ['PSA', 118, 24],
  ['MRK', 11, 24], ['JHN', 11, 25], ['GAL', 5, 22], ['EPH', 6, 10], ['HEB', 4, 16], ['PSA', 100, 4], ['ISA', 43, 2],
  ['MAT', 7, 7], ['1CO', 10, 13], ['JAS', 4, 8], ['PSA', 51, 10], ['JHN', 1, 1], ['REV', 21, 4], ['PSA', 30, 5],
];

/** Days since 1970-01-01 in Kampala (UTC+3), so the verse turns over at local midnight. */
export function kampalaDayNumber(now = new Date()): number {
  return Math.floor((now.getTime() + 3 * 60 * 60 * 1000) / 86_400_000);
}

export function verseReferenceFor(now = new Date()) {
  const [book, chapter, verse] = VERSES[kampalaDayNumber(now) % VERSES.length];
  return { book, chapter, verse };
}

export type VerseOfDay = {
  text: string;
  reference: string;
  translationName: string;
  /** ISO 639-3 language of the text actually shown (may be English if no translation exists). */
  language: string;
  href: string;
};

function verseText(content: unknown[]): string {
  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part === 'object' && 'text' in part) return String((part as { text: string }).text);
      return '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fromTranslation(translation: BibleTranslation, ref: { book: string; chapter: number; verse: number }) {
  const books = await listBibleBooks(translation.id);
  const book = books.find((b) => b.id === ref.book);
  if (!book || ref.chapter > book.numberOfChapters) return null;
  const chapter = await getBibleChapter(translation, book, ref.chapter);
  const item = chapter.content.find((c) => c.type === 'verse' && c.number === ref.verse);
  if (!item || item.type !== 'verse') return null;
  const text = verseText(item.content);
  if (!text) return null;
  return {
    text,
    reference: `${book.name} ${ref.chapter}:${ref.verse}`,
    translationName: translation.name,
    language: translation.language,
    href: `${bibleHref(translation.id, book.id, ref.chapter)}#v${ref.verse}`,
  } satisfies VerseOfDay;
}

/** Today's verse in the visitor's language, falling back to English. Null if the Bible service is down. */
export async function getVerseOfDay(locale: Locale, now = new Date()): Promise<VerseOfDay | null> {
  try {
    const ref = verseReferenceFor(now);
    const translations = await listBibleTranslations();
    const wanted = LOCALE_BIBLE_LANGUAGE[locale];
    const inLanguage = locale === 'en' ? null : translations.find((t) => t.language === wanted && t.numberOfBooks >= 66);
    if (inLanguage) {
      const verse = await fromTranslation(inLanguage, ref).catch(() => null);
      if (verse) return verse;
    }
    const english = defaultTranslation(translations);
    return english ? await fromTranslation(english, ref) : null;
  } catch {
    return null;
  }
}
