import Link from 'next/link';
import type { Dict } from '@/lib/i18n';
import type { VerseOfDay as Verse } from '@/lib/verseOfDay';
import { Reveal } from './Reveal';

/** Today's verse in the visitor's language, linking into the Bible page at that verse. */
export function VerseOfDay({ verse, t }: { verse: Verse | null; t: Dict }) {
  if (!verse) return null;
  return (
    <section aria-label={t.verse.eyebrow} className="bg-cream px-4 py-16 text-center text-ink sm:px-6">
      <Reveal className="mx-auto max-w-3xl">
        <p className="text-[13px] font-extrabold tracking-[0.22em] text-gold-ink">{t.verse.eyebrow}</p>
        <blockquote className="mt-6" lang={verse.language}>
          <p className="font-display text-[clamp(26px,3vw,40px)] font-light italic leading-snug">
            &ldquo;{verse.text}&rdquo;
          </p>
          <footer className="mt-5 text-sm tracking-wide text-ink/70">
            <cite className="not-italic font-bold text-gold-ink">{verse.reference}</cite>
            <span className="mx-2" aria-hidden="true">·</span>
            {verse.translationName}
          </footer>
        </blockquote>
        <Link href={verse.href} className="mt-6 inline-block font-semibold text-gold-ink underline underline-offset-4">
          {t.verse.read}
        </Link>
      </Reveal>
    </section>
  );
}
