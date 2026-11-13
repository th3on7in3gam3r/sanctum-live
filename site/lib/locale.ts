import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, dictionary, isLocale, LOCALE_COOKIE, type Dict, type Locale } from './i18n';

/**
 * The visitor's language: their saved choice, else their browser's Luganda or
 * Kiswahili preference, else English.
 */
export async function getLocale(): Promise<Locale> {
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
