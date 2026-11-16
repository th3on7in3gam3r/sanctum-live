export type SiteEnv = {
  apiUrl: string;
  orgSlug: string;
  revalidateSecret: string;
  sanctumAppUrl: string;
  prayerRoomSlug: string;
  siteUrl: string;
};

function trimSlash(value: string) {
  return value.replace(/\/$/, '');
}

export function siteEnv(): SiteEnv {
  const revalidateSecret = process.env.REVALIDATE_SECRET
    || (process.env.NODE_ENV === 'production' ? '' : 'dev-revalidate-secret');
  return {
    apiUrl: trimSlash(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'),
    orgSlug: process.env.ORG_SLUG || 'promised-land-christian-center',
    revalidateSecret,
    sanctumAppUrl: trimSlash(process.env.SANCTUM_APP_URL || 'https://plcc-sanctum.onrender.com'),
    prayerRoomSlug: process.env.PRAYER_ROOM_SLUG || 'promised-land-christian-center',
    siteUrl: trimSlash(process.env.SITE_URL || 'http://127.0.0.1:3002'),
  };
}

/** PLCC ONE: one sign-in for PLCC Chat, Vault, Connect and Tithe. */
export function plccOneUrl() {
  // Always the sign-in page: the bare address redirects to this website.
  const base = trimSlash(process.env.PLCC_ONE_URL || 'https://plcc-opal.vercel.app');
  return base.includes('#') ? base : `${base}/#/login`;
}

/**
 * "Live prayer" opens Jordan, which finds the Live Huddle the member can join
 * (or says none is live). PLCC Sanctum stays the overflow room for very large
 * gatherings: sanctumPrayerUrl(), or set LIVE_PRAYER_URL to point everything there.
 */
export function prayerJoinUrl() {
  const override = trimSlash(process.env.LIVE_PRAYER_URL || '');
  if (override) return override;
  return `${trimSlash(process.env.JORDAN_APP_URL || 'https://plcc-chat.vercel.app')}/live`;
}

/**
 * "Join the live huddle" on the Huddles and Ministries pages. Huddles meet in Jordan,
 * so this opens Jordan's live-prayer page. HUDDLES_IN_SANCTUM=true sends each one to
 * its PLCC Sanctum room instead (overflow).
 */
export function huddleJoinUrl(sanctumSlug: string) {
  if (process.env.HUDDLES_IN_SANCTUM === 'true') return `${siteEnv().sanctumAppUrl}/join/${sanctumSlug}`;
  return prayerJoinUrl();
}

export function sanctumPrayerUrl() {
  const env = siteEnv();
  return `${env.sanctumAppUrl}/join/${env.prayerRoomSlug}`;
}
