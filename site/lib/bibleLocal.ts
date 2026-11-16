import type { BibleBook, BibleChapter, BibleTranslation, ChapterItem } from './bible';
import LCB_BOOKS from '@/data/bible/lcb/books.json';

/**
 * Bibles bundled with the site (not fetched from the Free Use Bible API).
 *
 * Biblica® Bayibuli Entukuvu (Open Luganda Contemporary Bible), CC BY-SA 4.0.
 * Built unmodified from Biblica's USX by scripts/build-luganda-bible.py into
 * data/bible/lcb/{BOOK}.json. This is the church's Luganda Bible: it replaces any
 * Luganda translation the API offers.
 */
export const LCB_ID = 'lug_lcb';

export const LCB_TRANSLATION: BibleTranslation = {
  id: LCB_ID,
  name: 'Bayibuli Entukuvu',
  englishName: 'Luganda Contemporary Bible',
  shortName: 'LCB',
  language: 'lug',
  textDirection: 'ltr',
  numberOfBooks: 66,
  licenseNotice:
    'Biblica® Bayibuli Entukuvu, Endagaano Enkadde nʼEndagaano Empya ekwatiddwa ku katambi™. Copyright © 1984, 1986, 1993, 2014 by Biblica, Inc. Used under the Creative Commons Attribution-ShareAlike 4.0 license. The original work by Biblica, Inc. is available for free at www.biblica.com and open.bible.',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  website: 'https://open.bible',
  source: { name: 'Biblica · open.bible', url: 'https://open.bible' },
};

type LocalBook = {
  id: string;
  name: string;
  chapters: { number: number; content: ChapterItem[]; footnotes: BibleChapter['footnotes'] }[];
};

const BOOKS: BibleBook[] = (LCB_BOOKS as BibleBook[]).map((b) => ({ ...b }));
const BOOK_IDS = new Set(BOOKS.map((b) => b.id));

export function isLocalTranslation(id: string): boolean {
  return id === LCB_ID;
}

export function listLocalBooks(): BibleBook[] {
  return BOOKS.map((b) => ({ ...b }));
}

const cache = new Map<string, Promise<LocalBook>>();

function loadBook(id: string): Promise<LocalBook> {
  if (!BOOK_IDS.has(id)) return Promise.reject(new Error('This book is not in this Bible.'));
  let pending = cache.get(id);
  if (!pending) {
    pending = import(`@/data/bible/lcb/${id}.json`).then((mod) => (mod.default ?? mod) as LocalBook);
    pending.catch(() => cache.delete(id));
    cache.set(id, pending);
  }
  return pending;
}

export async function getLocalChapter(book: BibleBook, chapter: number): Promise<BibleChapter> {
  const data = await loadBook(book.id);
  const ch = data.chapters.find((c) => c.number === chapter);
  if (!ch) throw new Error('This chapter is not in this Bible.');
  const index = BOOKS.findIndex((b) => b.id === book.id);
  const prevBook = BOOKS[index - 1];
  const nextBook = BOOKS[index + 1];
  const previous =
    chapter > 1 ? { book: book.id, chapter: chapter - 1 } : prevBook ? { book: prevBook.id, chapter: prevBook.numberOfChapters } : null;
  const next =
    chapter < book.numberOfChapters ? { book: book.id, chapter: chapter + 1 } : nextBook ? { book: nextBook.id, chapter: 1 } : null;
  return {
    translation: LCB_TRANSLATION,
    book,
    chapter,
    // Fresh copies: callers may decorate the content.
    content: structuredClone(ch.content),
    footnotes: ch.footnotes.map((n) => ({ ...n })),
    previous,
    next,
    audio: [],
  };
}
