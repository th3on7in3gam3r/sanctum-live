import { unstable_cache } from 'next/cache';
import { LCB_TRANSLATION, getLocalChapter, isLocalTranslation, listLocalBooks } from './bibleLocal';

/**
 * Bible text from the Free Use Bible API (bible.helloao.org, AO Lab):
 * public-domain and openly licensed translations, no key, no usage limits.
 * Each translation carries its own license notice, which the page shows.
 */
const API = (process.env.BIBLE_API_ORIGIN || 'https://bible.helloao.org').replace(/\/+$/, '');

/** Languages offered, in display order: Uganda first, then the wider church family. */
export const BIBLE_LANGUAGES: { code: string; label: string; english: string }[] = [
  { code: 'lug', label: 'Luganda', english: 'Luganda' },
  { code: 'swh', label: 'Kiswahili', english: 'Swahili' },
  { code: 'swa', label: 'Kiswahili', english: 'Swahili' },
  { code: 'eng', label: 'English', english: 'English' },
  { code: 'nyn', label: 'Runyankore', english: 'Nyankore' },
  { code: 'cgg', label: 'Rukiga', english: 'Chiga' },
  { code: 'xog', label: 'Lusoga', english: 'Soga' },
  { code: 'teo', label: 'Ateso', english: 'Teso' },
  { code: 'ach', label: 'Acholi', english: 'Acholi' },
  { code: 'laj', label: 'Lango', english: 'Lango' },
  { code: 'lgg', label: 'Lugbara', english: 'Lugbara' },
  { code: 'kin', label: 'Kinyarwanda', english: 'Kinyarwanda' },
  { code: 'fra', label: 'Français', english: 'French' },
  { code: 'spa', label: 'Español', english: 'Spanish' },
  { code: 'por', label: 'Português', english: 'Portuguese' },
  { code: 'deu', label: 'Deutsch', english: 'German' },
  { code: 'arb', label: 'العربية', english: 'Arabic' },
];

const LANGUAGE_ORDER = new Map(BIBLE_LANGUAGES.map((lang, index) => [lang.code, index]));

export type BibleTranslation = {
  id: string;
  name: string;
  englishName: string;
  shortName: string;
  language: string;
  textDirection: 'ltr' | 'rtl';
  numberOfBooks: number;
  licenseNotice: string | null;
  licenseUrl: string;
  website: string;
  /** Where the text comes from, for the credit line. Absent means the Free Use Bible API. */
  source?: { name: string; url: string };
};

export type BibleBook = {
  id: string;
  name: string;
  order: number;
  numberOfChapters: number;
};

type VerseItem =
  | string
  | { text: string; poem?: number; wordsOfJesus?: boolean }
  | { heading: string }
  | { lineBreak: true }
  | { noteId: number };

export type ChapterItem =
  | { type: 'heading'; content: string[] }
  | { type: 'line_break' }
  | { type: 'verse'; number: number; content: VerseItem[] }
  | { type: 'hebrew_subtitle'; content: VerseItem[] };

export type BibleChapter = {
  translation: BibleTranslation;
  book: BibleBook;
  chapter: number;
  content: ChapterItem[];
  footnotes: { noteId: number; text: string; caller: string | null; verse?: number }[];
  previous: { book: string; chapter: number } | null;
  next: { book: string; chapter: number } | null;
  /** Narrated audio for this chapter, when the translation has it (e.g. BSB). */
  audio: { name: string; url: string }[];
};

type RawTranslation = {
  id: string;
  name: string;
  englishName: string;
  shortName?: string;
  language: string;
  textDirection?: 'ltr' | 'rtl';
  numberOfBooks: number;
  licenseNotice?: string | null;
  licenseUrl: string;
  website: string;
};

async function getJson<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${API}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`Bible text is unavailable right now (${res.status}).`);
  return (await res.json()) as T;
}

/**
 * Translations in our languages with at least a complete New Testament.
 * The full catalog is large, so only the filtered list is cached (daily).
 */
const listApiTranslations = unstable_cache(
  async (): Promise<BibleTranslation[]> => {
    const res = await fetch(`${API}/api/available_translations.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Bible translations are unavailable right now (${res.status}).`);
    const data = (await res.json()) as { translations: RawTranslation[] };
    return data.translations
      .filter((t) => LANGUAGE_ORDER.has(t.language) && t.numberOfBooks >= 27)
      .map((t) => ({
        id: t.id,
        name: t.name,
        englishName: t.englishName,
        shortName: t.shortName || t.id,
        language: t.language === 'swa' ? 'swh' : t.language,
        textDirection: (t.textDirection === 'rtl' ? 'rtl' : 'ltr') as 'ltr' | 'rtl',
        numberOfBooks: t.numberOfBooks,
        licenseNotice: t.licenseNotice ?? null,
        licenseUrl: t.licenseUrl,
        website: t.website,
      }))
      .sort(
        (a, b) =>
          (LANGUAGE_ORDER.get(a.language) ?? 99) - (LANGUAGE_ORDER.get(b.language) ?? 99) ||
          b.numberOfBooks - a.numberOfBooks ||
          a.name.localeCompare(b.name)
      );
  },
  ['plcc-bible-translations-v1'],
  { revalidate: 86400 }
);

/**
 * Every translation offered. Luganda is the church's own choice, Bayibuli Entukuvu
 * (bundled with the site), in place of any Luganda translation the API carries.
 * If the API is down, Bayibuli Entukuvu is still offered.
 */
export async function listBibleTranslations(): Promise<BibleTranslation[]> {
  const fromApi = await listApiTranslations().catch(() => [] as BibleTranslation[]);
  const others = fromApi.filter((t) => t.language !== LCB_TRANSLATION.language);
  return [{ ...LCB_TRANSLATION }, ...others];
}

export async function listBibleBooks(translationId: string): Promise<BibleBook[]> {
  if (isLocalTranslation(translationId)) return listLocalBooks();
  const data = await getJson<{ books: BibleBook[] }>(
    `/api/${encodeURIComponent(translationId)}/books.json`,
    604800
  );
  return data.books
    .filter((book) => !(book as { isApocryphal?: boolean }).isApocryphal)
    .map((book) => ({ id: book.id, name: book.name, order: book.order, numberOfChapters: book.numberOfChapters }))
    .sort((a, b) => a.order - b.order);
}

export async function getBibleChapter(
  translation: BibleTranslation,
  book: BibleBook,
  chapter: number
): Promise<BibleChapter> {
  if (isLocalTranslation(translation.id)) return getLocalChapter(book, chapter);
  const data = await getJson<{
    chapter: {
      number: number;
      content: ChapterItem[];
      footnotes: { noteId: number; text: string; caller: string | null; reference?: { verse: number } }[];
    };
    previousChapterReference: { book: string; chapter: number } | null;
    nextChapterReference: { book: string; chapter: number } | null;
    thisChapterAudioLinks?: Record<string, string>;
  }>(`/api/${encodeURIComponent(translation.id)}/${book.id}/${chapter}.json`, 604800);
  return {
    translation,
    book,
    chapter: data.chapter.number,
    content: data.chapter.content,
    footnotes: data.chapter.footnotes.map((note) => ({
      noteId: note.noteId,
      text: note.text,
      caller: note.caller,
      verse: note.reference?.verse,
    })),
    previous: data.previousChapterReference
      ? { book: data.previousChapterReference.book, chapter: data.previousChapterReference.chapter }
      : null,
    next: data.nextChapterReference
      ? { book: data.nextChapterReference.book, chapter: data.nextChapterReference.chapter }
      : null,
    audio: Object.entries(data.thisChapterAudioLinks || {})
      .filter(([, url]) => typeof url === 'string' && url.startsWith('https://'))
      .map(([name, url]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), url })),
  };
}

/** Plain text of each verse (for compare, copy and share). Drops the KJV's ¶ paragraph marks. */
export function versesAsText(content: ChapterItem[]): Record<number, string> {
  const out: Record<number, string> = {};
  for (const item of content) {
    if (item.type !== 'verse') continue;
    const text = item.content
      .map((part) => (typeof part === 'string' ? part : 'text' in part ? part.text : ''))
      .join(' ')
      .replace(/¶\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    out[item.number] = out[item.number] ? `${out[item.number]} ${text}` : text;
  }
  return out;
}

/** English KJV first (what the church reads aloud), then BSB, then the first English. */
export function defaultTranslation(translations: BibleTranslation[]): BibleTranslation | undefined {
  const english = translations.filter((t) => t.language === 'eng');
  return (
    english.find((t) => /(^|_)kjv$/i.test(t.id) || /king james/i.test(t.englishName)) ??
    english.find((t) => t.id === 'BSB') ??
    english[0] ??
    translations[0]
  );
}

export function languageLabel(code: string): string {
  const lang = BIBLE_LANGUAGES.find((l) => l.code === code);
  if (!lang) return code;
  return lang.label === lang.english ? lang.label : `${lang.label} · ${lang.english}`;
}

export function bibleHref(translation: string, book: string, chapter: number): string {
  return `/bible?t=${encodeURIComponent(translation)}&b=${encodeURIComponent(book)}&c=${chapter}`;
}
