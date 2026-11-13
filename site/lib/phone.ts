import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/min';

/** The church is in Uganda, so a number with no country code is read as Ugandan. */
export const DEFAULT_PHONE_COUNTRY: CountryCode = 'UG';

/** Shown first in the country picker: Uganda, East Africa, then where members abroad usually live. */
const PREFERRED: CountryCode[] = ['UG', 'KE', 'TZ', 'RW', 'SS', 'CD', 'BI', 'US', 'GB', 'CA', 'ZA', 'AE', 'SA', 'QA', 'DE', 'NL', 'SE', 'AU'];

export type PhoneCountry = { code: CountryCode; name: string; dial: string };

function countryName(code: string, names: Intl.DisplayNames | null): string {
  try {
    return names?.of(code) || code;
  } catch {
    return code;
  }
}

export function phoneCountries(): { preferred: PhoneCountry[]; others: PhoneCountry[] } {
  const names = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
  const all = getCountries().map((code) => ({
    code,
    name: countryName(code, names),
    dial: `+${getCountryCallingCode(code)}`,
  }));
  const preferred = PREFERRED.map((code) => all.find((c) => c.code === code)).filter((c): c is PhoneCountry => Boolean(c));
  const others = all.filter((c) => !PREFERRED.includes(c.code)).sort((a, b) => a.name.localeCompare(b.name));
  return { preferred, others };
}

export function isPhoneCountry(value: string): value is CountryCode {
  return (getCountries() as string[]).includes(value);
}

/**
 * Reads a phone number typed in any common way (0772 000000, +256 772 000000,
 * 00256…, a US or UK number with its country picked) and returns it in
 * international E.164 form (+256772000000), or a friendly error.
 */
export function normalizePhone(
  raw: string,
  country: string = DEFAULT_PHONE_COUNTRY
): { ok: true; e164: string } | { ok: false; error: string } {
  const value = raw.trim().replace(/^00/, '+');
  if (!value) return { ok: false, error: 'Phone number is required.' };
  const region = isPhoneCountry(country) ? country : DEFAULT_PHONE_COUNTRY;
  const parsed = parsePhoneNumberFromString(value, region);
  if (!parsed || !parsed.isValid()) {
    const example = region === 'UG' ? '0772 000000 or +256 772 000000' : `a number from ${region} with its country selected`;
    return { ok: false, error: `That number does not look right. Use ${example}.` };
  }
  return { ok: true, e164: parsed.number };
}
