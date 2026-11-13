'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LOCALE_COOKIE, LOCALE_NAMES, LOCALES, type Locale } from '@/lib/i18n';

/** English · Luganda · Kiswahili. Saves the choice for a year and re-renders the page. */
export function LanguageSwitcher({
  locale,
  label,
  className = '',
  variant = 'compact',
}: {
  locale: Locale;
  label: string;
  className?: string;
  variant?: 'compact' | 'short' | 'list';
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (next: Locale) => {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => router.refresh());
  };

  if (variant === 'list') {
    return (
      <div className={className} role="group" aria-label={label}>
        <p className="eyebrow">{label}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              lang={code}
              onClick={() => choose(code)}
              aria-pressed={code === locale}
              disabled={pending}
              className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${
                code === locale ? 'border-gold bg-gold text-ink' : 'border-sand/40 text-on-dark hover:border-gold-light'
              }`}
            >
              {LOCALE_NAMES[code]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-3 opacity-80" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
      </svg>
      <select
        value={locale}
        disabled={pending}
        onChange={(event) => choose(event.target.value as Locale)}
        title={label}
        className={`min-h-11 cursor-pointer appearance-none rounded-full border border-sand/40 bg-transparent py-2 pl-9 text-sm text-on-dark outline-none focus:border-gold-light [&>option]:text-ink ${variant === 'short' ? 'pr-3 font-semibold' : 'pr-4'}`}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code} lang={code}>
            {variant === 'short' ? code.toUpperCase() : LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
