import type { Role, RoleCapability } from '../types';
import {
  canCreatePrayerRoom,
  canInviteSpeaker,
  canManageParticipants,
  canManageTeam,
  canPublishAudio as canPublishSessionAudio,
  canStartPrayerSession,
  canViewPrivatePrayerRequests,
  type OrganizationRole,
  type SessionRole,
} from '../../shared/roles.ts';

export {
  canCreatePrayerRoom,
  canInviteSpeaker,
  canManageParticipants,
  canManageTeam,
  canStartPrayerSession,
  canViewPrivatePrayerRequests,
  canPublishSessionAudio,
};

export const ROLE_CAPABILITIES: Record<Role, RoleCapability> = {
  OWNER: {
    role: 'OWNER',
    label: 'Senior Pastor / Owner',
    description: 'Full organization control, billing, church configuration, team management, and prayer rooms.',
    canSpeakAutomatically: false,
    canInviteSpeakers: true,
    canMuteSpeakers: true,
    canManageRooms: true,
    canEndSessions: true,
    canViewPrivateRequests: true,
    canManageSettings: true,
  },
  ADMIN: {
    role: 'ADMIN',
    label: 'Church Administrator',
    description: 'Help run prayer rooms: invite to speak, mute, unmute, and remove listeners. Cannot invite more Admins.',
    canSpeakAutomatically: false,
    canInviteSpeakers: true,
    canMuteSpeakers: true,
    canManageRooms: true,
    canEndSessions: true,
    canViewPrivateRequests: true,
    canManageSettings: false,
  },
  PRAYER_LEADER: {
    role: 'PRAYER_LEADER',
    label: 'Prayer Leader / Pastor',
    description: 'Can start sessions, invite attendees to pray, mute speakers, and manage raised hands.',
    canSpeakAutomatically: false,
    canInviteSpeakers: true,
    canMuteSpeakers: true,
    canManageRooms: false,
    canEndSessions: true,
    canViewPrivateRequests: true,
    canManageSettings: false,
  },
  TECHNICAL_ADMIN: {
    role: 'TECHNICAL_ADMIN',
    label: 'Technical Administrator',
    description: 'Operational session and participant controls without access to private prayer requests.',
    canSpeakAutomatically: false,
    canInviteSpeakers: true,
    canMuteSpeakers: true,
    canManageRooms: false,
    canEndSessions: false,
    canViewPrivateRequests: false,
    canManageSettings: false,
  },
  SPEAKER: {
    role: 'SPEAKER',
    label: 'Invited Speaker',
    description: 'Session-only role. Authorized to publish microphone audio only while holding the speaker floor.',
    canSpeakAutomatically: false,
    canInviteSpeakers: false,
    canMuteSpeakers: false,
    canManageRooms: false,
    canEndSessions: false,
    canViewPrivateRequests: false,
    canManageSettings: false,
  },
  LISTENER: {
    role: 'LISTENER',
    label: 'Congregation Listener',
    description: 'Listen to live prayer, send reactions (Amen/Praise God), raise hand to pray, and submit prayer requests.',
    canSpeakAutomatically: false,
    canInviteSpeakers: false,
    canMuteSpeakers: false,
    canManageRooms: false,
    canEndSessions: false,
    canViewPrivateRequests: false,
    canManageSettings: false,
  },
};

export function hasPermission(role: Role, action: keyof Omit<RoleCapability, 'role' | 'label' | 'description'>): boolean {
  const capabilities = ROLE_CAPABILITIES[role];
  if (!capabilities) return false;
  return Boolean(capabilities[action]);
}

export function canModerate(role: Role): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'PRAYER_LEADER' || role === 'TECHNICAL_ADMIN';
}

export function canPublishAudio(role: Role, holdsSpeakerFloor = false): boolean {
  if (isOrganizationRole(role)) return false;
  return canPublishSessionAudio(role as SessionRole, holdsSpeakerFloor);
}

function isOrganizationRole(role: Role): role is OrganizationRole {
  return role === 'OWNER' || role === 'ADMIN' || role === 'PRAYER_LEADER' || role === 'TECHNICAL_ADMIN';
}
