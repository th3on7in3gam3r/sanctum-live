import type { PublicLeader } from '@/lib/api';

const photoFallbacks: Record<string, string> = {
  Grace: '/pastor-grace.jpg',
  Kennedy: '/pastor-kennedy.jpg',
};

const bioFallbacks: Record<string, string> = {
  Kennedy:
    'Pastor Kennedy is a devoted servant of God, committed to teaching the Word and leading the church in worship and mission.',
};

export function leaderPhotoUrl(leader: Pick<PublicLeader, 'name' | 'photoUrl'>) {
  if (leader.photoUrl) return leader.photoUrl;
  for (const [key, path] of Object.entries(photoFallbacks)) {
    if (leader.name.includes(key)) return path;
  }
  return null;
}

export function leaderBio(leader: Pick<PublicLeader, 'name' | 'bio'>) {
  if (leader.bio) return leader.bio;
  for (const [key, text] of Object.entries(bioFallbacks)) {
    if (leader.name.includes(key)) return text;
  }
  return null;
}
