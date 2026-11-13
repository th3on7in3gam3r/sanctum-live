'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

type PickerTranslation = { id: string; name: string; shortName: string; language: string };
type PickerBook = { id: string; name: string; numberOfChapters: number };

const STORAGE_KEY = 'plcc_bible_last_v1';

function href(t: string, b: string, c: number) {
  return `/bible?t=${encodeURIComponent(t)}&b=${encodeURIComponent(b)}&c=${c}`;
}

const selectClass =
  'h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-[15px] font-semibold text-ink outline-none focus:border-forest-800 focus:ring-2 focus:ring-forest-800/15';

export function BiblePicker({
  languages,
  translations,
  books,
  translationId,
  bookId,
  chapter,
  usedDefaults,
  labels = { language: 'Language', translation: 'Translation', book: 'Book', chapter: 'Chapter' },
}: {
  labels?: { language: string; translation: string; book: string; chapter: string };
  languages: { code: string; label: string }[];
  translations: PickerTranslation[];
  books: PickerBook[];
  translationId: string;
  bookId: string;
  chapter: number;
  /** True when the URL named no translation/book, so we may restore the reader's last place. */
  usedDefaults: boolean;
}) {
  const router = useRouter();
  const current = translations.find((t) => t.id === translationId);
  const language = current?.language ?? languages[0]?.code ?? 'eng';
  const inLanguage = useMemo(() => translations.filter((t) => t.language === language), [translations, language]);
  const book = books.find((b) => b.id === bookId);

  // Remember where the reader is; come back to it next visit.
  useEffect(() => {
    try {
      if (usedDefaults) {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as { t: string; b: string; c: number } | null;
        if (saved && translations.some((t) => t.id === saved.t) && (saved.t !== translationId || saved.b !== bookId || saved.c !== chapter)) {
          router.replace(href(saved.t, saved.b, saved.c));
          return;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ t: translationId, b: bookId, c: chapter }));
    } catch {
      /* private browsing */
    }
  }, [usedDefaults, translationId, bookId, chapter, translations, router]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 min-[900px]:grid-cols-[1fr_1.4fr_1.3fr_0.7fr]">
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-gold-text">{labels.language}</span>
        <select
          className={selectClass}
          value={language}
          onChange={(event) => {
            const next = translations.find((t) => t.language === event.target.value);
            if (next) router.push(href(next.id, bookId, chapter));
          }}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-gold-text">{labels.translation}</span>
        <select
          className={selectClass}
          value={translationId}
          onChange={(event) => router.push(href(event.target.value, bookId, chapter))}
        >
          {inLanguage.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-gold-text">{labels.book}</span>
        <select
          className={selectClass}
          value={bookId}
          onChange={(event) => router.push(href(translationId, event.target.value, 1))}
        >
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-gold-text">{labels.chapter}</span>
        <select
          className={selectClass}
          value={chapter}
          onChange={(event) => router.push(href(translationId, bookId, Number(event.target.value)))}
        >
          {Array.from({ length: book?.numberOfChapters ?? 1 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
