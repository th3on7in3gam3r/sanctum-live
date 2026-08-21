export type OrganizationRole = 'OWNER' | 'ADMIN' | 'PRAYER_LEADER' | 'TECHNICAL_ADMIN';

export type SessionRole = 'HOST' | 'MODERATOR' | 'SPEAKER' | 'LISTENER';

export type OrgPermission =
  | 'organization.manage'
  | 'room.create'
  | 'room.edit'
  | 'room.delete'
  | 'session.start'
  | 'session.end'
  | 'session.manage'
  | 'participant.remove'
  | 'participant.inviteToSpeak'
  | 'participant.revokeSpeaker'
  | 'participant.mute'
  | 'prayerRequest.viewPrivate'
  | 'prayerRequest.manage'
  | 'team.manage';

export const INVITEABLE_ORG_ROLES = ['ADMIN'] as const;

export function isInviteableOrgRole(role: string): role is 'ADMIN' {
  return (INVITEABLE_ORG_ROLES as readonly string[]).includes(role);
}

export const ORGANIZATION_PERMISSIONS: Record<OrganizationRole, readonly OrgPermission[]> = {
  OWNER: [
    'organization.manage',
    'room.create',
    'room.edit',
    'room.delete',
    'session.start',
    'session.end',
    'session.manage',
    'participant.remove',
    'participant.inviteToSpeak',
    'participant.revokeSpeaker',
    'participant.mute',
    'prayerRequest.viewPrivate',
    'prayerRequest.manage',
    'team.manage',
  ],
  ADMIN: [
    'room.create',
    'room.edit',
    'room.delete',
    'session.start',
    'session.end',
    'session.manage',
    'participant.remove',
    'participant.inviteToSpeak',
    'participant.revokeSpeaker',
    'participant.mute',
    'prayerRequest.viewPrivate',
    'prayerRequest.manage',
  ],
  PRAYER_LEADER: [
    'session.start',
    'session.end',
    'session.manage',
    'participant.inviteToSpeak',
    'participant.revokeSpeaker',
    'participant.mute',
    'prayerRequest.viewPrivate',
    'prayerRequest.manage',
  ],
  TECHNICAL_ADMIN: [
    'session.manage',
    'participant.remove',
    'participant.inviteToSpeak',
    'participant.revokeSpeaker',
    'participant.mute',
  ],
};

export function hasOrgPermission(role: OrganizationRole, permission: OrgPermission): boolean {
  return ORGANIZATION_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canManageTeam(role: OrganizationRole): boolean {
  return hasOrgPermission(role, 'team.manage');
}

export function canManageOrganization(role: OrganizationRole): boolean {
  return hasOrgPermission(role, 'organization.manage');
}

export function canCreatePrayerRoom(role: OrganizationRole): boolean {
  return hasOrgPermission(role, 'room.create');
}

export function canMuteCongregation(role: OrganizationRole): boolean {
  return hasOrgPermission(role, 'room.edit');
}

export function canDeletePrayerRoom(role: OrganizationRole): boolean {
  return hasOrgPermission(role, 'room.delete');
}

export function canStartPrayerSession(role: OrganizationRole): boolean {
  return hasOrgPermission(role, 'session.start');
}

export function canManageParticipants(role: OrganizationRole): boolean {
  return (
    hasOrgPermission(role, 'participant.remove') ||
    hasOrgPermission(role, 'participant.mute') ||
    hasOrgPermission(role, 'session.manage')
  );
}

export function canInviteSpeaker(role: OrganizationRole): boolean {
  return hasOrgPermission(role, 'participant.inviteToSpeak');
}

export function canViewPrivatePrayerRequests(role: OrganizationRole): boolean {
  return hasOrgPermission(role, 'prayerRequest.viewPrivate');
}

export function isSessionModerator(role: SessionRole): boolean {
  return role === 'HOST' || role === 'MODERATOR';
}

export function canPublishAudio(sessionRole: SessionRole, holdsSpeakerFloor: boolean): boolean {
  return sessionRole === 'SPEAKER' && holdsSpeakerFloor;
}

export function isSessionSpeaker(role: SessionRole): boolean {
  return role === 'SPEAKER';
}

export function deriveSessionRoleFromOrgRole(orgRole: OrganizationRole | null): SessionRole {
  if (orgRole === 'OWNER' || orgRole === 'ADMIN') return 'HOST';
  if (orgRole === 'PRAYER_LEADER' || orgRole === 'TECHNICAL_ADMIN') return 'MODERATOR';
  return 'LISTENER';
}
