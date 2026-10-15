import { Organization } from '../types';

/** Shape default for AuthContext before /api/me. Not dashboard content. */
export const SEED_ORGANIZATION: Organization = {
  id: 'org_promised_land_christian_center',
  name: 'Promised Land Christian Center',
  slug: 'promised-land-christian-center',
  country: 'Uganda',
  timezone: 'Africa/Kampala',
  website: '',
  primaryContactName: 'Pastor GraceLove Hiire',
  primaryContactEmail: 'promisedlandchc@gmail.com',
  phone: '+256 744 836 784',
  accentColor: '#203C32',
  joinPageMessage: 'Welcome to Promised Land Christian Center. Join your church family in prayer.',
  defaultSermonSpeaker: 'Pastor GraceLove Hiire',
  speakerAliases: [],
  defaultRoomType: 'AUDIO_PRAYER',
  defaultSpeakerPermission: 'ADMIN_APPROVAL_REQUIRED',
  defaultRecording: false,
  defaultExpectedAttendance: 2000,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-08-18T00:00:00.000Z',
};
