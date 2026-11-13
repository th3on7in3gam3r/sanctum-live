import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, dictionary, isLocale, LOCALE_COOKIE, type Dict, type Locale } from './i18n';
import { requestLocale } from './requestLocale';

/**
 * The visitor's language: their saved choice, else their browser's Luganda or
 * Kiswahili preference, else English.
 */
export async function getLocale(): Promise<Locale> {
  const locale = await detectLocale();
  requestLocale().value = locale;
  return locale;
}

async function detectLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const accept = ((await headers()).get('accept-language') || '').toLowerCase();
  for (const part of accept.split(',')) {
    const tag = part.split(';')[0].trim();
    if (tag.startsWith('lg')) return 'lg';
    if (tag.startsWith('sw')) return 'sw';
    if (tag.startsWith('en')) return 'en';
  }
  return DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<{ locale: Locale; t: Dict }> {
  const locale = await getLocale();
  return { locale, t: dictionary(locale) };
}

/** East African countries where we offer Kiswahili; Uganda also gets Luganda. */
const SWAHILI_COUNTRIES = new Set(['KE', 'TZ', 'RW', 'BI', 'CD', 'SS']);

/**
 * Which languages to offer this visitor (once): only when they have not chosen
 * yet, are reading in English, and Vercel places them in East Africa.
 */
export async function languageOffer(locale: Locale): Promise<Locale[]> {
  if (locale !== 'en') return [];
  if ((await cookies()).get(LOCALE_COOKIE)?.value) return [];
  const country = ((await headers()).get('x-vercel-ip-country') || '').toUpperCase();
  if (country === 'UG') return ['lg', 'sw'];
  if (SWAHILI_COUNTRIES.has(country)) return ['sw'];
  return [];
}
