'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { dictionary, fill, LOCALE_COOKIE, LOCALE_NAMES, type Locale } from '@/lib/i18n';

/**
 * A one-time, dismissible offer to read the site in Luganda or Kiswahili, shown to
 * visitors in East Africa who have not picked a language yet. Never switches by
 * itself: the visitor chooses, and "Keep English" stops the offer for good.
 */
export function LanguageOffer({ offer }: { offer: Locale[] }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [pending, startTransition] = useTransition();
  if (hidden || !offer.length) return null;

  const save = (locale: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setHidden(true);
    if (locale !== 'en') startTransition(() => router.refresh());
  };

  const en = dictionary('en');
  // Ask in each offered language too, so the question reads naturally to the people it is for.
  const questions = [
    fill(en.offer.question, { langs: offer.map((l) => LOCALE_NAMES[l]).join(' or ') }),
    ...offer.map((l) => fill(dictionary(l).offer.question, { langs: LOCALE_NAMES[l] })),
  ];

  return (
    <aside
      role="dialog"
      aria-label="Choose a language"
      className="fixed inset-x-3 bottom-[4.25rem] z-50 rounded-[22px] border border-gold/45 bg-forest-950/95 p-5 text-on-dark shadow-2xl backdrop-blur min-[900px]:bottom-6 min-[900px]:left-6 min-[900px]:right-auto min-[900px]:max-w-sm"
    >
      <p className="font-display text-xl text-cream">{questions[0]}</p>
      {questions.slice(1).map((q, i) => (
        <p key={i} lang={offer[i]} className="mt-1 text-sm text-muted-dark">{q}</p>
      ))}
      <div className="mt-4 flex flex-wrap gap-2">
        {offer.map((l) => (
          <button
            key={l}
            type="button"
            lang={l}
            disabled={pending}
            onClick={() => save(l)}
            className="min-h-11 rounded-full bg-gold px-4 text-sm font-bold text-ink disabled:opacity-60"
          >
            {fill(dictionary(l).offer.yes, { lang: LOCALE_NAMES[l] })}
          </button>
        ))}
        <button
          type="button"
          onClick={() => save('en')}
          className="min-h-11 rounded-full border border-sand/40 px-4 text-sm font-semibold text-on-dark"
        >
          {en.offer.no}
        </button>
      </div>
    </aside>
  );
}
