/**
 * Licensed Bibles (NIV, NKJV) through the YouVersion Platform API.
 *
 * PLCC registered "PLCC ONE Bible" at platform.youversion.com. A version only
 * appears here once its license is accepted in that portal: we ask YouVersion
 * for each version and leave it out if it isn't available, so nothing breaks
 * before (or if) a license is turned off.
 *
 * App keys are not secrets (YouVersion's own docs), but it can be replaced
 * without a code change by setting YVP_APP_KEY on the website's Vercel project.
 */
import { unstable_cache } from 'next/cache';
import type { BibleBook, BibleChapter, BibleTranslation, ChapterItem } from './bible';
import { listLocalBooks } from './bibleLocal';

const YVP_API = 'https://api.youversion.com';
const YVP_APP_KEY = (process.env.YVP_APP_KEY || 'Ii22qrDmcSpeG5oT6V6WcMj8n7FOAlVdZscP7UQGgzceBIfl').trim();

/** Our ids (prefixed so they can never clash with the Free Use Bible API's ids). */
export const YOUVERSION_BIBLES: { id: string; yvId: number; name: string; shortName: string }[] = [
  { id: 'yv_niv', yvId: 111, name: 'New International Version', shortName: 'NIV' },
  { id: 'yv_nkjv', yvId: 114, name: 'New King James Version', shortName: 'NKJV' },
];

export function isYouVersionTranslation(id: string): boolean {
  return YOUVERSION_BIBLES.some((b) => b.id === id);
}

function yvIdOf(id: string): number {
  const found = YOUVERSION_BIBLES.find((b) => b.id === id);
  if (!found) throw new Error('Unknown YouVersion Bible.');
  return found.yvId;
}

async function yv<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${YVP_API}${path}`, {
    headers: { 'X-YVP-App-Key': YVP_APP_KEY, Accept: 'application/json' },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`YouVersion is unavailable right now (${res.status}).`);
  return (await res.json()) as T;
}

type YvVersion = {
  id: number;
  abbreviation?: string;
  localized_abbreviation?: string;
  title?: string;
  localized_title?: string;
  copyright?: string | null;
  promotional_content?: string | null;
};

/** The YouVersion Bibles this app key may show today, with their copyright lines. Daily cache. */
export const listYouVersionTranslations = unstable_cache(
  async (): Promise<BibleTranslation[]> => {
    const out: BibleTranslation[] = [];
    for (const b of YOUVERSION_BIBLES) {
      try {
        const v = await yv<YvVersion>(`/v1/bibles/${b.yvId}`, 86400);
        out.push({
          id: b.id,
          name: v.localized_title || v.title || b.name,
          englishName: v.title || b.name,
          shortName: v.localized_abbreviation || v.abbreviation || b.shortName,
          language: 'eng',
          textDirection: 'ltr',
          numberOfBooks: 66,
          licenseNotice: stripTags(v.copyright || v.promotional_content || '') || `${b.name}. Used with permission via YouVersion.`,
          licenseUrl: `https://www.bible.com/versions/${b.yvId}`,
          website: `https://www.bible.com/versions/${b.yvId}`,
          source: { name: 'YouVersion', url: `https://www.bible.com/versions/${b.yvId}` },
        });
      } catch {
        /* license not accepted yet, or YouVersion down: leave this Bible out */
      }
    }
    // Don't remember "none": throwing skips the cache, so the next visit asks again.
    if (!out.length) throw new Error('No YouVersion Bibles available yet.');
    return out;
  },
  ['plcc-bible-youversion-v2'],
  { revalidate: 3600 }
);

/** What YouVersion says about each Bible, for /api/bible/youversion-status. No secrets. */
export async function youVersionStatus(): Promise<
  { id: string; yvId: number; status: number | null; ok: boolean; title: string | null; message: string | null }[]
> {
  const out = [];
  for (const b of YOUVERSION_BIBLES) {
    try {
      const res = await fetch(`${YVP_API}/v1/bibles/${b.yvId}`, {
        headers: { 'X-YVP-App-Key': YVP_APP_KEY, Accept: 'application/json' },
        cache: 'no-store',
      });
      const text = await res.text();
      let title: string | null = null;
      try {
        title = (JSON.parse(text) as YvVersion).title ?? null;
      } catch {
        /* not JSON */
      }
      out.push({ id: b.id, yvId: b.yvId, status: res.status, ok: res.ok, title, message: res.ok ? null : text.slice(0, 300) });
    } catch (err) {
      out.push({ id: b.id, yvId: b.yvId, status: null, ok: false, title: null, message: err instanceof Error ? err.message : 'request failed' });
    }
  }
  return out;
}

type YvBook = { id: string; title: string; canon?: string; chapters?: { id: string; title: string }[] };

export async function listYouVersionBooks(translationId: string): Promise<BibleBook[]> {
  const data = await yv<{ data: YvBook[] }>(`/v1/bibles/${yvIdOf(translationId)}/books`, 604800);
  // English book names come from YouVersion; chapter counts fall back to the
  // standard 66-book canon if a book arrives without its chapter list.
  const canon = new Map(listLocalBooks().map((b) => [b.id, b.numberOfChapters]));
  return (data.data || [])
    .filter((b) => b.canon !== 'deuterocanon')
    .map((b, i) => ({
      id: b.id,
      name: b.title,
      order: i + 1,
      // Chapters are listed as ids ("GEN.1"…); intros aren't numbered chapters.
      numberOfChapters:
        (b.chapters || []).filter((c) => /^\d+$/.test(c.title) || /^\d+$/.test(c.id) || /\.\d+$/.test(c.id)).length ||
        canon.get(b.id) ||
        0,
    }))
    .filter((b) => b.numberOfChapters > 0);
}

export async function getYouVersionChapter(
  translation: BibleTranslation,
  book: BibleBook,
  chapter: number,
  books: BibleBook[]
): Promise<BibleChapter> {
  const data = await yv<{ id: string; content: string; reference?: string }>(
    `/v1/bibles/${yvIdOf(translation.id)}/passages/${book.id}.${chapter}?format=html&include_headings=true&include_notes=false`,
    604800
  );
  const content = parseYouVersionHtml(data.content || '');
  if (!content.some((item) => item.type === 'verse')) throw new Error('Bible text is unavailable right now.');
  const idx = books.findIndex((b) => b.id === book.id);
  const prevBook = idx > 0 ? books[idx - 1] : null;
  const nextBook = idx >= 0 && idx < books.length - 1 ? books[idx + 1] : null;
  return {
    translation,
    book,
    chapter,
    content,
    footnotes: [],
    previous: chapter > 1 ? { book: book.id, chapter: chapter - 1 } : prevBook ? { book: prevBook.id, chapter: prevBook.numberOfChapters } : null,
    next: chapter < book.numberOfChapters ? { book: book.id, chapter: chapter + 1 } : nextBook ? { book: nextBook.id, chapter: 1 } : null,
    audio: [],
  };
}

/* ---------------- HTML → verses ---------------- */

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+|#39);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function stripTags(s: string): string {
  return decode(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** Remove footnote/cross-reference spans (they nest other spans). */
function stripNotes(html: string): string {
  let out = html;
  for (;;) {
    const start = out.search(/<span class="yv-n\b[^"]*">/);
    if (start < 0) return out;
    let depth = 0;
    const re = /<span\b[^>]*>|<\/span>/g;
    re.lastIndex = start;
    let end = -1;
    for (let m = re.exec(out); m; m = re.exec(out)) {
      depth += m[0].startsWith('</') ? -1 : 1;
      if (depth === 0) {
        end = m.index + m[0].length;
        break;
      }
    }
    if (end < 0) return out.slice(0, start);
    out = out.slice(0, start) + out.slice(end);
  }
}

/**
 * YouVersion passage HTML → the site's chapter items. Verse starts look like
 * <span class="yv-v" v="N"></span><span class="yv-vlbl">N</span>; section
 * headings are <div class="s1 yv-h">…</div>. Text runs until the next verse.
 */
export function parseYouVersionHtml(html: string): ChapterItem[] {
  const items: ChapterItem[] = [];
  const src = stripNotes(html);
  const token =
    /<div class="[^"]*\byv-h\b[^"]*">([\s\S]*?)<\/div>|<span class="yv-v" v="(\d+)"><\/span>(?:<span class="yv-vlbl">[^<]*<\/span>)?/g;
  let current: number | null = null;
  let buffer = '';
  let last = 0;
  const flush = () => {
    const text = stripTags(buffer);
    buffer = '';
    if (current == null || !text) return;
    items.push({ type: 'verse', number: current, content: [text] });
  };
  for (let m = token.exec(src); m; m = token.exec(src)) {
    buffer += src.slice(last, m.index);
    last = token.lastIndex;
    if (m[1] !== undefined) {
      flush();
      const heading = stripTags(m[1]);
      if (heading) items.push({ type: 'heading', content: [heading] });
    } else {
      flush();
      current = Number.parseInt(m[2], 10);
    }
  }
  buffer += src.slice(last);
  flush();
  return items;
}
