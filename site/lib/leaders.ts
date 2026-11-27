import type { PublicLeader } from '@/lib/api';
import { church } from '@/lib/church';

/**
 * Official portraits supplied by the church (cropped from their leadership posters).
 * These win over a photo uploaded in Canaan, so the site always shows the approved picture.
 * To let Canaan's photo show again for someone, remove their line here.
 */
const officialPortraits: Record<string, string> = {
  Grace: '/leader-grace.jpg',
  Kennedy: '/leader-kennedy.jpg',
  Sandra: '/leader-sandra.jpg',
};

const bioFallbacks: Record<string, string> = {
  Grace:
    'A woman of deep faith and prayer, passionate about seeing lives transformed by the gospel of Christ.',
  Kennedy:
    'A devoted servant of God, committed to teaching the Word and leading the church in worship and mission.',
  Sandra:
    'Leads the Finance and Treasury Department, caring for the giving of God’s people with faithfulness and transparency.',
};

export type LeaderSocial = { kind: 'youtube' | 'tiktok' | 'whatsapp'; href: string; label: string };

const socialLinks: Record<string, LeaderSocial[]> = {
  Grace: [
    { kind: 'youtube', href: church.youtube, label: `YouTube ${church.youtubeLabel}` },
    { kind: 'tiktok', href: church.tiktok, label: `TikTok ${church.tiktokLabel}` },
  ],
  Kennedy: [
    { kind: 'youtube', href: church.youtube, label: `YouTube ${church.youtubeLabel}` },
    { kind: 'whatsapp', href: church.whatsapp, label: 'WhatsApp the church' },
  ],
};

/** Shown when Canaan has no entry for them yet (or the leaders list can't be reached). */
const builtInLeaders: PublicLeader[] = [
  { id: 'builtin-grace', name: 'Pastor Grace Hiire', role: 'Senior Pastor', photoUrl: null, bio: null, sortOrder: 1 },
  { id: 'builtin-kennedy', name: 'Pastor Kennedy Hiire', role: 'Senior Pastor', photoUrl: null, bio: null, sortOrder: 2 },
  { id: 'builtin-sandra', name: 'Sandra Namuswe', role: 'Finance & Treasury', photoUrl: null, bio: null, sortOrder: 50 },
];

function match<T>(name: string, table: Record<string, T>): T | undefined {
  for (const [key, value] of Object.entries(table)) {
    if (name.includes(key)) return value;
  }
  return undefined;
}

export function leaderPhotoUrl(leader: Pick<PublicLeader, 'name' | 'photoUrl'>) {
  return match(leader.name, officialPortraits) || leader.photoUrl || null;
}

export function leaderBio(leader: Pick<PublicLeader, 'name' | 'bio'>) {
  return leader.bio || match(leader.name, bioFallbacks) || null;
}

export function leaderSocials(leader: Pick<PublicLeader, 'name'>) {
  return match(leader.name, socialLinks) || [];
}

/** Canaan's list, plus any built-in leader it doesn't have yet (matched by first name). */
export function withBuiltInLeaders(leaders: PublicLeader[]) {
  const firstName = (name: string) => name.replace(/^(Pastor|Ps\.?|Pr\.?|Apostle)\s+/i, '').split(/\s+/)[0];
  const missing = builtInLeaders.filter(
    (fallback) => !leaders.some((leader) => leader.name.includes(firstName(fallback.name))),
  );
  return [...leaders, ...missing].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function isPastor(leader: Pick<PublicLeader, 'role' | 'name'>) {
  return /pastor|apostle/i.test(leader.role) || /^(Pastor|Apostle)\b/i.test(leader.name);
}
