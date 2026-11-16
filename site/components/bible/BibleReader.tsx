'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import type { ChapterItem } from '@/lib/bible';
import { parseReference } from '@/lib/bibleRef';

/* ── Types ──────────────────────────────────────────────────────────────── */

export type ReaderTranslation = {
  id: string;
  name: string;
  englishName: string;
  shortName: string;
  language: string;
  textDirection: 'ltr' | 'rtl';
};
export type ReaderBook = { id: string; name: string; order: number; numberOfChapters: number };
export type ReaderChapter = {
  translation: ReaderTranslation & { licenseNotice: string | null };
  book: ReaderBook;
  chapter: number;
  content: ChapterItem[];
  footnotes: { noteId: number; text: string; caller: string | null; verse?: number }[];
  previous: { book: string; chapter: number } | null;
  next: { book: string; chapter: number } | null;
  audio: { name: string; url: string }[];
};
type Labels = { language: string; translation: string; book: string; chapter: string };

/* ── Small helpers ──────────────────────────────────────────────────────── */

const STORAGE = {
  last: 'plcc_bible_last_v1',
  size: 'plcc_bible_size_v1',
  saved: 'plcc_bible_saved_v1',
  days: 'plcc_bible_days_v1',
  journal: 'plcc_bible_journal_v1',
  compare: 'plcc_bible_compare_v1',
};
const SIZES = [18, 20, 22, 25];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private browsing */
  }
}
const href = (t: string, b: string, c: number, v?: number) =>
  `/bible?t=${encodeURIComponent(t)}&b=${encodeURIComponent(b)}&c=${c}${v ? `&v=${v}` : ''}`;
const todayKey = () => new Date().toLocaleDateString('en-CA');
/** "King James (Authorized) Version" → KJV; otherwise the translation's short name. */
export const shortLabel = (t: { englishName: string; shortName: string; id: string }) =>
  /king james/i.test(t.englishName) || /(^|_)kjv$/i.test(t.id) ? 'KJV' : t.shortName;

const STEPS = [
  'Take five quiet minutes to pray and return your attention to God.',
  'Send one verse from today’s reading to someone who needs encouragement.',
  'Read today’s chapter aloud once, slowly.',
  'Thank God for three specific things before you sleep.',
  'Pray by name for one person in your family and one in the church.',
  'Choose one verse and carry it with you through the day.',
  'Forgive someone in your heart today, and tell God about it.',
];
const STOP = new Set(
  'the and of to in that he his i a is for unto shall be ye they with not all them their it was as which you your my me him have will from this are by but on there were thy thee so or at had when what an we were our who one hath o us also even then out up do upon these those into if no said say come came shall let now has her she been than more any can did did own went like before after over made make man men day'.split(
    ' '
  )
);

/* ── Icons (inline, no icon library on this site) ───────────────────────── */

type IconProps = { className?: string; filled?: boolean };
const Svg = ({ className = 'h-5 w-5', children, filled }: IconProps & { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const I = {
  search: (p: IconProps) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>,
  bookmark: (p: IconProps) => <Svg {...p}><path d="M6 3h12v18l-6-4-6 4z" /></Svg>,
  focus: (p: IconProps) => <Svg {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></Svg>,
  close: (p: IconProps) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>,
  left: (p: IconProps) => <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>,
  right: (p: IconProps) => <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>,
  down: (p: IconProps) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>,
  up: (p: IconProps) => <Svg {...p}><path d="m18 15-6-6-6 6" /></Svg>,
  leaf: (p: IconProps) => <Svg {...p}><path d="M5 21c0-9 6-15 15-16-1 9-7 15-15 16Z" /><path d="M5 21 14 12" /></Svg>,
  book: (p: IconProps) => <Svg {...p}><path d="M3 5.5C5.5 4 9 4 12 6c3-2 6.5-2 9-.5V19c-2.5-1.5-6-1.5-9 .5-3-2-6.5-2-9-.5Z" /><path d="M12 6v13.5" /></Svg>,
  pen: (p: IconProps) => <Svg {...p}><path d="m4 20 4-1 11-11-3-3L5 16z" /><path d="m14 6 3 3" /></Svg>,
  lock: (p: IconProps) => <Svg {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>,
  layers: (p: IconProps) => <Svg {...p}><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></Svg>,
  copy: (p: IconProps) => <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></Svg>,
  check: (p: IconProps) => <Svg {...p}><path d="m5 12 5 5L20 7" /></Svg>,
  headphones: (p: IconProps) => <Svg {...p}><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="14" width="4" height="7" rx="1.5" /><rect x="17" y="14" width="4" height="7" rx="1.5" /></Svg>,
  whatsapp: ({ className = 'h-5 w-5' }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z" />
    </svg>
  ),
};

/* ── Verse model ────────────────────────────────────────────────────────── */

type Verse = { number: number; text: string; rich: ReactNode[]; heading?: string };

function buildVerses(content: ChapterItem[], callers: Map<number, string>): { verses: Verse[]; subtitle?: string } {
  const verses: Verse[] = [];
  let pendingHeading: string | undefined;
  let subtitle: string | undefined;
  const byNumber = new Map<number, Verse>();
  for (const item of content) {
    if (item.type === 'heading') {
      pendingHeading = item.content.join(' ');
      continue;
    }
    if (item.type === 'line_break') continue;
    if (item.type === 'hebrew_subtitle') {
      subtitle = item.content.map((p) => (typeof p === 'string' ? p : 'text' in p ? p.text : '')).join(' ').trim();
      continue;
    }
    const rich: ReactNode[] = [];
    const plain: string[] = [];
    item.content.forEach((part, i) => {
      if (typeof part === 'string') {
        const s = part.replace(/¶\s*/g, '');
        plain.push(s);
        rich.push(<Fragment key={i}>{s} </Fragment>);
      } else if ('text' in part) {
        plain.push(part.text);
        rich.push(
          <span key={i} className={part.wordsOfJesus ? 'text-[#8b2e2e]' : undefined}>
            {part.text}{' '}
          </span>
        );
      } else if ('heading' in part) {
        pendingHeading = part.heading;
      } else if ('lineBreak' in part) {
        rich.push(<br key={i} />);
      } else if ('noteId' in part) {
        rich.push(
          <sup key={i}>
            <a href={`#note-${part.noteId}`} onClick={(e) => e.stopPropagation()} className="px-0.5 font-sans text-[11px] font-bold text-gold-text no-underline">
              {callers.get(part.noteId)}
            </a>
          </sup>
        );
      }
    });
    const text = plain.join(' ').replace(/\s+/g, ' ').trim();
    const existing = byNumber.get(item.number);
    if (existing) {
      existing.text = `${existing.text} ${text}`;
      existing.rich.push(...rich);
      continue;
    }
    const verse: Verse = { number: item.number, text, rich, heading: pendingHeading };
    pendingHeading = undefined;
    byNumber.set(item.number, verse);
    verses.push(verse);
  }
  return { verses, subtitle };
}

function highlight(text: string, query: string): ReactNode {
  if (!query) return text;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safe})`, 'ig'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-gold-light/70 px-0.5 text-ink">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

/* ── Shared bits of UI ──────────────────────────────────────────────────── */

const card = 'rounded-[22px] border border-ink/[0.08] bg-[#fffdf8] shadow-[0_1px_2px_rgba(22,37,31,0.04),0_12px_32px_rgba(22,37,31,0.05)]';
const selectCls =
  'h-11 w-full appearance-none rounded-xl border border-ink/15 bg-white pl-3.5 pr-9 text-[15px] font-medium text-ink outline-none transition focus:border-forest-800 focus:ring-2 focus:ring-forest-800/15';
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';

function Select({ label, value, onChange, children, className = '' }: { label?: string; value: string | number; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="mb-1.5 block text-[13px] font-medium text-ink/65">{label}</span> : null}
      <span className="relative block">
        <select className={selectCls} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
          {children}
        </select>
        <I.down className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
      </span>
    </label>
  );
}

function IconButton({ label, onClick, pressed, children }: { label: string; onClick: () => void; pressed?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-ink/80 transition hover:bg-ink/5 hover:text-ink ${focusRing}`}
    >
      {children}
    </button>
  );
}

/* ── The reader ─────────────────────────────────────────────────────────── */

export function BibleReader({
  chapter,
  books,
  translations,
  languages,
  labels,
  usedDefaults,
  initialVerse,
}: {
  chapter: ReaderChapter;
  books: ReaderBook[];
  translations: ReaderTranslation[];
  languages: { code: string; label: string }[];
  labels: Labels;
  usedDefaults: boolean;
  initialVerse?: number;
}) {
  const router = useRouter();
  const t = chapter.translation;
  const book = chapter.book;
  const ref = `${book.name} ${chapter.chapter}`;
  const tLabel = shortLabel(t);
  const subtitleName = t.language === 'eng' ? t.englishName : t.name;

  const callers = useMemo(
    () =>
      new Map(
        chapter.footnotes.map((note, i) => [note.noteId, note.caller && note.caller !== '+' ? note.caller : String.fromCharCode(97 + (i % 26))])
      ),
    [chapter.footnotes]
  );
  const { verses, subtitle } = useMemo(() => buildVerses(chapter.content, callers), [chapter.content, callers]);

  /* Reader state */
  const [sizeIdx, setSizeIdx] = useState(2);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>(initialVerse ? [initialVerse] : []);
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchNote, setSearchNote] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [saved, setSaved] = useState<{ t: string; b: string; c: number; label: string }[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const [compareId, setCompareId] = useState<string>('');
  const [compareOn, setCompareOn] = useState(false);
  const [compare, setCompare] = useState<{ name: string; bookName: string; short: string; verses: Record<number, string>; dir: 'ltr' | 'rtl'; lang: string } | null>(null);
  const [compareState, setCompareState] = useState<'idle' | 'loading' | 'error' | 'missing'>('idle');
  const [tab, setTab] = useState<'read' | 'understand' | 'live'>('live');
  const [panelOpen, setPanelOpen] = useState(false);
  const readerTop = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  }, []);

  /* Restore preferences, remember place */
  useEffect(() => {
    setSizeIdx(readJson(STORAGE.size, 2));
    setSaved(readJson(STORAGE.saved, []));
    setDays(readJson(STORAGE.days, []));
    const savedCompare = readJson<string>(STORAGE.compare, '');
    const fallback =
      t.language === 'eng'
        ? translations.find((x) => x.language === 'lug') ?? translations.find((x) => x.language === 'swh')
        : translations.find((x) => x.language === 'eng' && /king james/i.test(x.englishName)) ?? translations.find((x) => x.language === 'eng');
    const pick = translations.find((x) => x.id === savedCompare && x.id !== t.id) ?? fallback;
    setCompareId(pick?.id ?? '');
  }, [t.id, t.language, translations]);

  useEffect(() => {
    try {
      if (usedDefaults) {
        const last = readJson<{ t: string; b: string; c: number } | null>(STORAGE.last, null);
        if (last && translations.some((x) => x.id === last.t) && (last.t !== t.id || last.b !== book.id || last.c !== chapter.chapter)) {
          router.replace(href(last.t, last.b, last.c));
          return;
        }
      }
      writeJson(STORAGE.last, { t: t.id, b: book.id, c: chapter.chapter });
    } catch {
      /* ignore */
    }
  }, [usedDefaults, t.id, book.id, chapter.chapter, translations, router]);

  /* New chapter → reset per-chapter state; jump to a linked verse */
  useEffect(() => {
    setSelected(initialVerse ? [initialVerse] : []);
    setQuery('');
    setSearchNote('');
    if (initialVerse) {
      window.setTimeout(() => document.getElementById(`v${initialVerse}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
    }
  }, [t.id, book.id, chapter.chapter, initialVerse]);

  /* Compare languages: fetch the same chapter in a second translation */
  useEffect(() => {
    if (!compareOn || !compareId) return;
    let alive = true;
    setCompareState('loading');
    fetch(`/api/bible/chapter?t=${encodeURIComponent(compareId)}&b=${book.id}&c=${chapter.chapter}`)
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!alive) return;
        if (r.status === 404) {
          setCompare(null);
          setCompareState('missing');
          return;
        }
        if (!r.ok || !data?.ok) throw new Error('fail');
        setCompare({
          name: data.translation.name,
          short: shortLabel({ englishName: translations.find((x) => x.id === compareId)?.englishName ?? '', shortName: data.translation.shortName, id: compareId }),
          bookName: data.bookName,
          verses: data.verses,
          dir: data.translation.textDirection,
          lang: data.translation.language,
        });
        setCompareState('idle');
      })
      .catch(() => {
        if (alive) setCompareState('error');
      });
    return () => {
      alive = false;
    };
  }, [compareOn, compareId, book.id, chapter.chapter, translations]);

  /* Focus mode: Escape closes, page doesn't scroll behind */
  useEffect(() => {
    if (!focusMode) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFocusMode(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [focusMode]);

  const fontSize = SIZES[sizeIdx] ?? 22;
  const setSize = (i: number) => {
    const n = Math.min(Math.max(i, 0), SIZES.length - 1);
    setSizeIdx(n);
    writeJson(STORAGE.size, n);
  };

  const isSaved = saved.some((s) => s.t === t.id && s.b === book.id && s.c === chapter.chapter);
  const toggleSaved = () => {
    const next = isSaved
      ? saved.filter((s) => !(s.t === t.id && s.b === book.id && s.c === chapter.chapter))
      : [{ t: t.id, b: book.id, c: chapter.chapter, label: `${ref} · ${tLabel}` }, ...saved].slice(0, 30);
    setSaved(next);
    writeJson(STORAGE.saved, next);
    showToast(isSaved ? 'Removed from saved chapters' : 'Saved — find it under Read');
  };

  const readToday = days.includes(todayKey());
  const markRead = () => {
    if (readToday) return;
    const next = [todayKey(), ...days].slice(0, 400);
    setDays(next);
    writeJson(STORAGE.days, next);
    showToast('Marked as read today');
  };

  const toggleVerse = (n: number) => setSelected((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].sort((a, b) => a - b)));

  const rangeLabel = (nums: number[]) => {
    if (!nums.length) return '';
    const groups: string[] = [];
    let start = nums[0];
    let prev = nums[0];
    for (const n of [...nums.slice(1), Infinity]) {
      if (n === prev + 1) {
        prev = n;
        continue;
      }
      groups.push(start === prev ? `${start}` : `${start}–${prev}`);
      start = prev = n;
    }
    return groups.join(', ');
  };

  const selectionText = (withCompare: boolean) => {
    const label = `${ref}:${rangeLabel(selected)} (${tLabel})`;
    const main = selected.map((n) => verses.find((v) => v.number === n)?.text ?? '').join(' ');
    let out = `“${main}”\n— ${label}`;
    if (withCompare && compare) {
      const second = selected.map((n) => compare.verses[n] ?? '').join(' ').trim();
      if (second) out += `\n\n“${second}”\n— ${compare.bookName} ${chapter.chapter}:${rangeLabel(selected)} (${compare.short})`;
    }
    return out;
  };
  const shareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${href(t.id, book.id, chapter.chapter, selected[0])}`;
  };
  const copySelection = async () => {
    try {
      await navigator.clipboard.writeText(`${selectionText(compareOn)}\n${shareUrl()}`);
      showToast('Copied');
    } catch {
      showToast('Could not copy on this device');
    }
  };
  const whatsappSelection = () => {
    const text = `${selectionText(compareOn)}\n\nRead it at Promised Land Christian Center: ${shareUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  /* Search: a reference jumps there; anything else searches this chapter */
  const runSearch = () => {
    const q = searchInput.trim();
    if (!q) {
      setQuery('');
      setSearchNote('');
      return;
    }
    const parsed = parseReference(q, books);
    if (parsed) {
      setSearchInput('');
      setQuery('');
      setSearchNote('');
      router.push(href(t.id, parsed.book, parsed.chapter, parsed.verse));
      return;
    }
    const hits = verses.filter((v) => v.text.toLowerCase().includes(q.toLowerCase()));
    setQuery(q);
    setSearchNote(hits.length ? `${hits.length} verse${hits.length === 1 ? '' : 's'} in ${ref} contain “${q}”` : `No verses in ${ref} contain “${q}”. Try a passage like John 3:16.`);
    if (hits[0]) window.setTimeout(() => document.getElementById(`v${hits[0].number}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  const words = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of verses)
      for (const w of v.text.toLowerCase().match(/[\p{L}’']+/gu) ?? []) {
        const word = w.replace(/[’']s$/, '');
        if (word.length < 4 || STOP.has(word)) continue;
        counts.set(word, (counts.get(word) ?? 0) + 1);
      }
    return [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [verses]);

  const minutes = Math.max(1, Math.round(verses.reduce((n, v) => n + v.text.split(' ').length, 0) / 200));
  const step = STEPS[Math.floor(Date.now() / 86400000) % STEPS.length];

  const goto = (target: { book: string; chapter: number } | null) => (target ? href(t.id, target.book, target.chapter) : null);
  const prevHref = goto(chapter.previous);
  const nextHref = goto(chapter.next);
  const bookName = (id: string) => books.find((b) => b.id === id)?.name ?? id;

  const openCompare = () => {
    setCompareOn(true);
    readerTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── Pieces ── */

  const verseList = (inFocus = false) => (
    <div dir={t.textDirection} lang={t.language} style={{ ['--fs' as string]: `${fontSize}px` }} className="font-display text-[calc(var(--fs)*0.84)] sm:text-[length:var(--fs)]">
      {subtitle ? <p className="mb-5 text-[0.8em] italic text-ink/65">{subtitle}</p> : null}
      <ol className="space-y-0.5">
        {verses.map((v) => {
          const isSel = selected.includes(v.number);
          const second = compareOn && compare ? compare.verses[v.number] : '';
          return (
            <li key={v.number}>
              {v.heading ? <h3 className="mb-2 mt-7 font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-gold-text first:mt-0">{v.heading}</h3> : null}
              <div
                id={inFocus ? undefined : `v${v.number}`}
                role="button"
                tabIndex={0}
                aria-pressed={isSel}
                aria-label={`Verse ${v.number}${isSel ? ', selected' : ''}`}
                onClick={() => toggleVerse(v.number)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleVerse(v.number);
                  }
                }}
                className={`grid cursor-pointer grid-cols-[1.7em_1fr] scroll-mt-32 rounded-2xl px-2 py-2 leading-[1.55] text-ink sm:grid-cols-[2.1em_1fr] transition-colors motion-reduce:transition-none sm:px-4 ${focusRing} ${
                  isSel ? 'bg-[#f6eedc] shadow-[inset_3px_0_0_#c9a35a]' : 'hover:bg-ink/[0.025]'
                }`}
              >
                <span className="pt-[0.28em] font-sans text-[0.62em] font-bold text-gold-text">{v.number}</span>
                <span>
                  {query ? highlight(v.text, query) : v.rich}
                  {second ? (
                    <span dir={compare?.dir} lang={compare?.lang} className="mt-2 block border-l-2 border-gold/50 pl-3 font-sans text-[0.72em] leading-relaxed text-ink/70">
                      {second}
                    </span>
                  ) : null}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );

  const chapterNav = (compact = false) => (
    <nav aria-label="Chapters" className="flex items-center justify-between gap-3">
      {prevHref ? (
        <Link href={prevHref} className={`inline-flex h-11 items-center gap-2 rounded-xl border border-ink/15 bg-white px-4 text-[15px] font-semibold text-ink transition hover:border-forest-800 ${focusRing}`}>
          <I.left className="h-4 w-4" /> Previous{compact ? null : <span className="hidden sm:inline">&nbsp;chapter</span>}
        </Link>
      ) : (
        <span />
      )}
      {nextHref ? (
        <Link href={nextHref} className={`inline-flex h-11 items-center gap-2 rounded-xl bg-forest-800 px-5 text-[15px] font-semibold text-cream transition hover:bg-forest-900 ${focusRing}`}>
          Next{compact ? null : <span className="hidden sm:inline">&nbsp;chapter</span>} <I.right className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );

  const compareBar = compareOn ? (
    <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gold/40 bg-[#fbf5e8] px-4 py-3">
      <I.layers className="h-5 w-5 text-gold-text" />
      <span className="text-sm font-semibold text-ink">Side by side with</span>
      <span className="relative">
        <select
          value={compareId}
          onChange={(e) => {
            setCompareId(e.target.value);
            writeJson(STORAGE.compare, e.target.value);
          }}
          aria-label="Second translation"
          className="h-9 appearance-none rounded-lg border border-ink/15 bg-white pl-3 pr-8 text-sm font-medium text-ink outline-none focus:border-forest-800"
        >
          {languages.map((lang) => {
            const list = translations.filter((x) => x.language === lang.code && x.id !== t.id);
            if (!list.length) return null;
            return (
              <optgroup key={lang.code} label={lang.label}>
                {list.map((x) => (
                  <option key={x.id} value={x.id}>
                    {lang.label.split(' · ')[0]} · {shortLabel(x)}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <I.down className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
      </span>
      <span className="text-sm text-ink/60" role="status">
        {compareState === 'loading' ? 'Loading…' : compareState === 'missing' ? `That translation doesn’t include ${book.name} yet.` : compareState === 'error' ? 'Couldn’t load it. Try again shortly.' : ''}
      </span>
      <button type="button" onClick={() => setCompareOn(false)} className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-ink/70 hover:text-ink ${focusRing}`}>
        <I.close className="h-4 w-4" /> Close
      </button>
    </div>
  ) : null;

  const sizeControl = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setSizeOpen((v) => !v)}
        aria-label="Text size"
        aria-expanded={sizeOpen}
        title="Text size"
        className={`inline-flex h-10 items-center rounded-full px-3 font-display text-[20px] text-ink/80 hover:bg-ink/5 ${focusRing}`}
      >
        Aa
      </button>
      {sizeOpen ? (
        <div className="absolute right-0 top-12 z-30 flex items-center gap-1 rounded-2xl border border-ink/10 bg-white p-1.5 shadow-xl">
          <button type="button" onClick={() => setSize(sizeIdx - 1)} disabled={sizeIdx === 0} aria-label="Smaller text" className={`h-10 w-10 rounded-xl font-display text-[15px] hover:bg-ink/5 disabled:opacity-30 ${focusRing}`}>A</button>
          <span className="flex gap-1 px-1" aria-hidden="true">
            {SIZES.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= sizeIdx ? 'bg-forest-800' : 'bg-ink/15'}`} />
            ))}
          </span>
          <button type="button" onClick={() => setSize(sizeIdx + 1)} disabled={sizeIdx === SIZES.length - 1} aria-label="Larger text" className={`h-10 w-10 rounded-xl font-display text-[22px] hover:bg-ink/5 disabled:opacity-30 ${focusRing}`}>A</button>
        </div>
      ) : null}
    </div>
  );

  /* Walk the Word panel */
  const weekDots = (() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { label: 'MTWTFSS'[i], done: days.includes(d.toLocaleDateString('en-CA')), today: d.toDateString() === now.toDateString() };
    });
  })();
  const streak = (() => {
    let n = 0;
    const d = new Date();
    if (!days.includes(d.toLocaleDateString('en-CA'))) d.setDate(d.getDate() - 1);
    while (days.includes(d.toLocaleDateString('en-CA'))) {
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  })();

  const miniCard = 'rounded-2xl border border-ink/[0.08] bg-white p-4';

  const panelBody = (
    <>
      <div role="tablist" aria-label="Walk the Word" className="mt-5 grid grid-cols-3 rounded-xl border border-ink/10 bg-white p-1">
        {(['read', 'understand', 'live'] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`h-9 rounded-lg text-[14px] font-semibold capitalize transition ${focusRing} ${tab === key ? 'bg-forest-800 text-cream shadow-sm' : 'text-ink/75 hover:text-ink'}`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3" role="tabpanel">
        {tab === 'read' ? (
          <>
            <div className={miniCard}>
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-gold-text">Today’s reading</p>
              <p className="mt-1 font-display text-[22px] text-ink">{ref}</p>
              <p className="text-sm text-ink/60">{verses.length} verses · about {minutes} min</p>
              <button
                type="button"
                onClick={markRead}
                className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition ${focusRing} ${readToday ? 'bg-[#e7efe9] text-forest-800' : 'bg-forest-800 text-cream hover:bg-forest-900'}`}
              >
                <I.check className="h-4 w-4" /> {readToday ? 'Read today' : 'Mark as read'}
              </button>
            </div>
            <div className={miniCard}>
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-ink">This week</p>
                <p className="text-sm text-ink/60">{streak ? `${streak}-day streak` : 'Start a streak today'}</p>
              </div>
              <ul className="mt-3 grid grid-cols-7 gap-1.5" aria-label="Days read this week">
                {weekDots.map((d, i) => (
                  <li key={i} className="flex flex-col items-center gap-1">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold ${d.done ? 'bg-forest-800 text-cream' : d.today ? 'border-2 border-gold text-ink' : 'bg-ink/[0.05] text-ink/50'}`} aria-label={`${d.label}${d.done ? ' read' : ''}`}>
                      {d.done ? <I.check className="h-4 w-4" /> : d.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {chapter.audio.length ? (
              <div className={miniCard}>
                <p className="flex items-center gap-2 font-semibold text-ink"><I.headphones className="h-5 w-5 text-gold-text" /> Listen to {ref}</p>
                <audio controls preload="none" src={chapter.audio[0].url} className="mt-3 w-full">
                  <track kind="captions" />
                </audio>
                <p className="mt-1 text-xs text-ink/55">Narrated by {chapter.audio[0].name}</p>
              </div>
            ) : null}
            <div className={miniCard}>
              <p className="font-semibold text-ink">Saved chapters</p>
              {saved.length ? (
                <ul className="mt-2 divide-y divide-ink/[0.06]">
                  {saved.slice(0, 8).map((s) => (
                    <li key={`${s.t}-${s.b}-${s.c}`}>
                      <Link href={href(s.t, s.b, s.c)} className="flex items-center justify-between py-2 text-[15px] text-ink hover:text-forest-800">
                        {s.label} <I.right className="h-4 w-4 text-ink/40" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-ink/60">Tap the bookmark beside the chapter title to keep it here.</p>
              )}
            </div>
          </>
        ) : null}

        {tab === 'understand' ? (
          <>
            <div className={miniCard}>
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-gold-text">About {book.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[13px] font-semibold text-ink/75">
                <span className="rounded-full bg-ink/[0.05] px-2.5 py-1">{book.order <= 39 ? 'Old Testament' : 'New Testament'}</span>
                <span className="rounded-full bg-ink/[0.05] px-2.5 py-1">Book {book.order} of 66</span>
                <span className="rounded-full bg-ink/[0.05] px-2.5 py-1">{book.numberOfChapters} chapter{book.numberOfChapters === 1 ? '' : 's'}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]" aria-hidden="true">
                <div className="h-full rounded-full bg-gold" style={{ width: `${(chapter.chapter / book.numberOfChapters) * 100}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-ink/55">Chapter {chapter.chapter} of {book.numberOfChapters}</p>
            </div>
            {words.length ? (
              <div className={miniCard}>
                <p className="font-semibold text-ink">Words that repeat here</p>
                <p className="text-sm text-ink/60">Repetition often points to what a passage stresses. Tap one to see it.</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {words.map(([w, n]) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => {
                        setSearchInput(w);
                        setQuery(w);
                        setSearchNote(`${verses.filter((v) => v.text.toLowerCase().includes(w)).length} verses in ${ref} contain “${w}”`);
                        readerTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`rounded-full border border-ink/12 bg-[#fbf8f1] px-3 py-1 text-[14px] text-ink hover:border-gold ${focusRing}`}
                    >
                      {w} <span className="text-ink/45">×{n}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className={miniCard}>
              <p className="font-semibold text-ink">Read it slowly</p>
              <ol className="mt-2 space-y-2 text-[15px] text-ink/80">
                <li><span className="font-semibold text-gold-text">Notice · </span>What does this chapter show you about God?</li>
                <li><span className="font-semibold text-gold-text">Reflect · </span>What does it show you about people — and about you?</li>
                <li><span className="font-semibold text-gold-text">Respond · </span>What is one thing to believe, pray or do this week?</li>
              </ol>
            </div>
          </>
        ) : null}

        {tab === 'live' ? (
          <>
            <div className={`${miniCard} flex gap-3`}>
              <I.leaf className="mt-0.5 h-6 w-6 shrink-0 text-gold-text" />
              <div>
                <p className="font-display text-[19px] text-ink">Today’s small step</p>
                <p className="mt-0.5 text-[15px] leading-snug text-ink/80">{step}</p>
              </div>
            </div>
            <Reflection key={`${t.id}-${book.id}-${chapter.chapter}`} refLabel={ref} storageKey={`${book.id}.${chapter.chapter}`} />
          </>
        ) : null}
      </div>

      <div className="mt-4 border-t border-ink/[0.08] pt-4 text-center">
        <button type="button" onClick={openCompare} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[15px] font-semibold text-gold-text hover:text-ink ${focusRing}`}>
          <I.layers className="h-5 w-5" /> Compare languages
        </button>
      </div>
    </>
  );

  /* ── Layout ── */

  return (
    <div className="mx-auto max-w-6xl">
      {/* Toolbar — computer */}
      <div className={`${card} hidden items-end gap-4 p-4 sm:p-5 min-[900px]:flex`}>
        <Select
          label={labels.language}
          value={t.language}
          className="w-[180px] shrink-0"
          onChange={(code) => {
            const next = translations.find((x) => x.language === code);
            if (next) router.push(href(next.id, book.id, chapter.chapter));
          }}
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </Select>
        <Select label={labels.translation} value={t.id} className="w-[170px] shrink-0" onChange={(id) => router.push(href(id, book.id, chapter.chapter))}>
          {translations.filter((x) => x.language === t.language).map((x) => (
            <option key={x.id} value={x.id} title={x.englishName}>{shortLabel(x)}</option>
          ))}
        </Select>
        <Select label={labels.book} value={book.id} className="w-[180px] shrink-0" onChange={(id) => router.push(href(t.id, id, 1))}>
          {books.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
        <Select label={labels.chapter} value={chapter.chapter} className="w-[110px] shrink-0" onChange={(c) => router.push(href(t.id, book.id, Number(c)))}>
          {Array.from({ length: book.numberOfChapters }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </Select>
        <span className="mb-1 h-9 w-px shrink-0 bg-ink/10" aria-hidden="true" />
        <SearchBox value={searchInput} onChange={setSearchInput} onSubmit={runSearch} />
      </div>

      {/* Toolbar — phone/tablet */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-ink/[0.06] bg-cream/95 px-4 py-3 backdrop-blur min-[900px]:hidden sm:-mx-6 sm:px-6">
        <div className="grid grid-cols-2 gap-2.5">
          <PassagePicker books={books} bookId={book.id} chapter={chapter.chapter} onPick={(b, c) => router.push(href(t.id, b, c))} />
          <Select value={t.id} onChange={(id) => router.push(href(id, book.id, chapter.chapter))}>
            {languages.map((lang) => {
              const list = translations.filter((x) => x.language === lang.code);
              if (!list.length) return null;
              return (
                <optgroup key={lang.code} label={lang.label}>
                  {list.map((x) => (
                    <option key={x.id} value={x.id}>{lang.label.split(' · ')[0]} · {shortLabel(x)}</option>
                  ))}
                </optgroup>
              );
            })}
          </Select>
        </div>
        <div className="mt-2.5">
          <SearchBox value={searchInput} onChange={setSearchInput} onSubmit={runSearch} />
        </div>
      </div>

      {searchNote ? (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink/70" role="status">
          {searchNote}
          <button type="button" onClick={() => { setQuery(''); setSearchNote(''); setSearchInput(''); }} className="font-semibold text-forest-800 underline">Clear</button>
        </p>
      ) : null}

      <div className="mt-6 grid items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_350px]">
        {/* Reader */}
        <article ref={readerTop} className={`${card} scroll-mt-24 p-4 sm:p-8`} aria-label={ref}>
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-[44px] leading-none tracking-[-0.02em] text-ink sm:text-[56px]">{ref}</h2>
              <p className="mt-2 font-display text-[17px] italic text-ink/70 sm:text-[19px]">{subtitleName}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {sizeControl}
              <span className="h-6 w-px bg-ink/10" aria-hidden="true" />
              <IconButton label={isSaved ? 'Remove from saved' : 'Save this chapter'} onClick={toggleSaved} pressed={isSaved}>
                <I.bookmark className={`h-5 w-5 ${isSaved ? 'text-gold' : ''}`} filled={isSaved} />
              </IconButton>
              <button
                type="button"
                onClick={() => setFocusMode(true)}
                className={`ml-1 hidden h-10 items-center gap-2 rounded-full bg-ink/[0.05] px-4 text-[14px] font-semibold text-ink hover:bg-ink/[0.08] sm:inline-flex ${focusRing}`}
              >
                <I.focus className="h-4 w-4" /> Focus mode
              </button>
            </div>
          </header>

          {compareBar}

          <div className="mt-6">{verseList()}</div>

          {chapter.footnotes.length ? (
            <aside className="mt-8 border-t border-ink/10 pt-5" aria-label="Footnotes">
              <ol className="space-y-1.5 text-sm text-ink/65">
                {chapter.footnotes.map((note) => (
                  <li key={note.noteId} id={`note-${note.noteId}`} className="scroll-mt-28">
                    <span className="mr-1.5 font-bold text-gold-text">{callers.get(note.noteId)}</span>
                    {note.verse ? <span className="mr-1">{note.verse}:</span> : null}
                    {note.text}
                  </li>
                ))}
              </ol>
            </aside>
          ) : null}

          <div className="mt-8 border-t border-ink/[0.08] pt-6">{chapterNav()}</div>
        </article>

        {/* Walk the Word — computer */}
        <aside className={`${card} hidden p-6 min-[1100px]:sticky min-[1100px]:top-6 min-[1100px]:block`} aria-label="Walk the Word">
          <h2 className="font-display text-[34px] leading-tight text-ink">Walk the Word</h2>
          <p className="mt-1 text-[15px] text-ink/65">From Scripture to everyday life.</p>
          {panelBody}
        </aside>

        {/* Walk the Word — phone/tablet (collapsible card) */}
        <section className={`${card} p-5 min-[1100px]:hidden`} aria-label="Walk the Word">
          <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-ink/15" aria-hidden="true" />
          <button type="button" onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen} className={`flex w-full items-start justify-between text-left ${focusRing}`}>
            <span>
              <span className="block font-display text-[28px] leading-tight text-ink">Walk the Word</span>
              <span className="block text-[15px] text-ink/65">From Scripture to everyday life.</span>
            </span>
            {panelOpen ? <I.up className="mt-2 h-5 w-5 text-ink/70" /> : <I.down className="mt-2 h-5 w-5 text-ink/70" />}
          </button>
          {panelOpen ? panelBody : (
            <div className="mt-4 grid grid-cols-3 rounded-xl border border-ink/10 bg-white p-1">
              {(['read', 'understand', 'live'] as const).map((key) => (
                <button key={key} type="button" onClick={() => { setTab(key); setPanelOpen(true); }} className={`h-9 rounded-lg text-[14px] font-semibold capitalize ${tab === key ? 'bg-forest-800 text-cream' : 'text-ink/75'}`}>
                  {key}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Selected verses: actions */}
      {selected.length ? (
        <div className="fixed inset-x-0 bottom-[136px] z-40 flex justify-center px-3 min-[900px]:bottom-6" role="region" aria-label="Selected verses">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-forest-900 p-1.5 pl-4 text-cream shadow-[0_18px_40px_rgba(13,26,20,0.35)]">
            <span className="whitespace-nowrap pr-2 text-sm font-semibold">
              {ref}:{rangeLabel(selected)}
            </span>
            <button type="button" onClick={copySelection} className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-semibold hover:bg-white/10 ${focusRing}`}>
              <I.copy className="h-4 w-4" /> Copy
            </button>
            <button type="button" onClick={whatsappSelection} className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#25d366] px-3.5 text-sm font-bold text-[#0b2b17] hover:brightness-105 ${focusRing}`}>
              <I.whatsapp className="h-4 w-4" /> {compareOn && compare ? 'Share both languages' : 'WhatsApp'}
            </button>
            {!compareOn ? (
              <button type="button" onClick={openCompare} className={`hidden h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-semibold hover:bg-white/10 sm:inline-flex ${focusRing}`}>
                <I.layers className="h-4 w-4" /> Add a language
              </button>
            ) : null}
            <button type="button" onClick={() => setSelected([])} aria-label="Clear selection" className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 ${focusRing}`}>
              <I.close className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Focus mode */}
      {focusMode ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#fbf8f1]" role="dialog" aria-modal="true" aria-label={`${ref}, focus mode`}>
          <div className="sticky top-0 flex items-center justify-between border-b border-ink/[0.06] bg-[#fbf8f1]/95 px-5 py-3 backdrop-blur">
            <p className="text-sm font-semibold text-ink/70">{ref} · {tLabel}</p>
            <div className="flex items-center gap-1">
              {sizeControl}
              <button type="button" onClick={() => setFocusMode(false)} autoFocus className={`inline-flex h-10 items-center gap-1.5 rounded-full bg-ink/[0.06] px-4 text-sm font-semibold text-ink hover:bg-ink/10 ${focusRing}`}>
                <I.close className="h-4 w-4" /> Exit
              </button>
            </div>
          </div>
          <div className="mx-auto max-w-[680px] px-5 pb-24 pt-10">
            <h2 className="font-display text-[48px] leading-none text-ink">{ref}</h2>
            <p className="mt-2 font-display text-lg italic text-ink/65">{subtitleName}</p>
            <div className="mt-8">{verseList(true)}</div>
            <div className="mt-10">{chapterNav()}</div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream shadow-lg" role="status">
          {toast}
        </div>
      ) : null}

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-ink/55">
        {t.licenseNotice ? `${t.licenseNotice} ` : ''}Text courtesy of the{' '}
        <a href="https://bible.helloao.org" className="underline" rel="noopener" target="_blank">Free Use Bible API</a>. {bookName(book.id)} {chapter.chapter} · {t.name}.
      </p>
    </div>
  );
}

/* ── Search box ─────────────────────────────────────────────────────────── */

function SearchBox({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  return (
    <form
      role="search"
      className="relative w-full min-w-0 flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <I.search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink/50" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search Scripture or go to John 3:16"
        aria-label="Search this chapter, or type a passage like John 3:16"
        className="h-11 w-full rounded-xl border border-ink/15 bg-white pl-10 pr-3 text-[15px] text-ink outline-none placeholder:text-ink/45 focus:border-forest-800 focus:ring-2 focus:ring-forest-800/15"
      />
    </form>
  );
}

/* ── Passage picker (phone): book list → chapter grid ───────────────────── */

function PassagePicker({ books, bookId, chapter, onPick }: { books: ReaderBook[]; bookId: string; chapter: number; onPick: (b: string, c: number) => void }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<ReaderBook | null>(null);
  const current = books.find((b) => b.id === bookId);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);
  const ot = books.filter((b) => b.order <= 39);
  const nt = books.filter((b) => b.order > 39);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPicked(null);
          setOpen(true);
        }}
        className="relative h-11 w-full truncate rounded-xl border border-ink/15 bg-white pl-3.5 pr-9 text-left text-[15px] font-medium text-ink"
        aria-haspopup="dialog"
      >
        {current?.name} {chapter}
        <I.down className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
      </button>
      {open && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Choose a passage">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} tabIndex={-1} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[26px] bg-[#fbf8f1] p-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              {picked ? (
                <button type="button" onClick={() => setPicked(null)} className="inline-flex items-center gap-1 text-sm font-semibold text-forest-800">
                  <I.left className="h-4 w-4" /> Books
                </button>
              ) : (
                <span className="text-sm font-semibold text-ink/60">Choose a book</span>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink/5">
                <I.close className="h-5 w-5" />
              </button>
            </div>
            {picked ? (
              <>
                <p className="font-display text-2xl text-ink">{picked.name}</p>
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {Array.from({ length: picked.numberOfChapters }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onPick(picked.id, n);
                      }}
                      className={`h-11 rounded-xl text-[15px] font-semibold ${picked.id === bookId && n === chapter ? 'bg-forest-800 text-cream' : 'bg-white text-ink ring-1 ring-ink/10'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              [
                ['Old Testament', ot],
                ['New Testament', nt],
              ].map(([title, list]) => (
                <div key={title as string} className="mb-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-text">{title as string}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(list as ReaderBook[]).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => (b.numberOfChapters === 1 ? (setOpen(false), onPick(b.id, 1)) : setPicked(b))}
                        className={`h-11 truncate rounded-xl px-3 text-left text-[15px] font-medium ${b.id === bookId ? 'bg-forest-800 text-cream' : 'bg-white text-ink ring-1 ring-ink/10'}`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}

/* ── Private reflection (saved on this device only) ─────────────────────── */

function Reflection({ refLabel, storageKey }: { refLabel: string; storageKey: string }) {
  const [entries, setEntries] = useState<Record<string, { text: string; at: string }>>({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  useEffect(() => {
    const all = readJson<Record<string, { text: string; at: string }>>(STORAGE.journal, {});
    setEntries(all);
    setDraft(all[storageKey]?.text ?? '');
  }, [storageKey]);
  const entry = entries[storageKey];
  const save = () => {
    const next = { ...entries };
    if (draft.trim()) next[storageKey] = { text: draft.trim(), at: new Date().toISOString() };
    else delete next[storageKey];
    setEntries(next);
    writeJson(STORAGE.journal, next);
    setEditing(false);
  };
  return (
    <div className="rounded-2xl border border-ink/[0.08] bg-white p-4">
      <div className="flex gap-3">
        <I.book className="mt-0.5 h-6 w-6 shrink-0 text-gold-text" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[19px] text-ink">My reflection</p>
          <p className="mt-0.5 text-[15px] leading-snug text-ink/80">What is God inviting you to change today?</p>
        </div>
      </div>
      {editing ? (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            autoFocus
            aria-label={`Reflection on ${refLabel}`}
            placeholder={`A few honest lines about ${refLabel}…`}
            className="w-full resize-y rounded-xl border border-ink/15 bg-[#fffdf8] p-3 text-[15px] leading-relaxed text-ink outline-none focus:border-forest-800 focus:ring-2 focus:ring-forest-800/15"
          />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={save} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-forest-800 text-[15px] font-semibold text-cream hover:bg-forest-900">
              <I.check className="h-4 w-4" /> Save
            </button>
            <button type="button" onClick={() => { setEditing(false); setDraft(entry?.text ?? ''); }} className="h-10 rounded-xl px-4 text-[15px] font-semibold text-ink/70 hover:bg-ink/5">
              Cancel
            </button>
          </div>
        </div>
      ) : entry ? (
        <button type="button" onClick={() => setEditing(true)} className="mt-3 block w-full rounded-xl bg-[#fbf5e8] p-3 text-left text-[15px] leading-relaxed text-ink hover:bg-[#f6eedc]">
          <span className="line-clamp-4 whitespace-pre-wrap">{entry.text}</span>
          <span className="mt-1.5 block text-xs font-semibold text-gold-text">
            {new Date(entry.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · Tap to edit
          </span>
        </button>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-forest-800 text-[15px] font-semibold text-cream hover:bg-forest-900">
          <I.pen className="h-4 w-4" /> Write privately
        </button>
      )}
      <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[13px] text-ink/55">
        <I.lock className="h-3.5 w-3.5" /> Saved only on this device. No one else can see it.
      </p>
    </div>
  );
}
