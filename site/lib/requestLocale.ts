import { cache } from 'react';
import { DEFAULT_LOCALE, type Locale } from './i18n';

/**
 * The visitor's language for the current server render. getLocale() fills it in,
 * so date helpers (formatKampala) can follow it without every caller passing it.
 * Outside a server render it stays English.
 */
export const requestLocale = cache((): { value: Locale } => ({ value: DEFAULT_LOCALE }));

export const INTL_LOCALE: Record<Locale, string> = { en: 'en-UG', lg: 'lg-UG', sw: 'sw-UG' };
