import { Organization } from '../types';

/** Shape default for AuthContext before /api/me. Not dashboard content. */
export const SEED_ORGANIZATION: Organization = {
  id: 'org_miracle_center_kampala',
  name: 'Miracle Center Kampala',
  slug: 'miracle-center-kampala',
  country: 'Uganda',
  timezone: 'Africa/Kampala',
  website: 'https://miraclecenter.org',
  primaryContactName: 'Pastor Kenneth',
  primaryContactEmail: 'kenneth@miraclecenter.org',
  phone: '+256 772 100 200',
  accentColor: '#203C32',
  joinPageMessage: 'Welcome to Miracle Center Kampala Live Prayer. Join your church family lifting one voice.',
  defaultRoomType: 'AUDIO_PRAYER',
  defaultSpeakerPermission: 'ADMIN_APPROVAL_REQUIRED',
  defaultRecording: false,
  defaultExpectedAttendance: 2000,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-08-18T00:00:00.000Z',
};
