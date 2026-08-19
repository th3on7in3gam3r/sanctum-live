/**
 * Clerk sessions authenticate. OrganizationMembership rows authorize.
 * Prototype `x-user-id` spoofing is no longer accepted.
 */
import { Unauthorized } from '../shared/errors.ts';
import {
  canCreatePrayerRoom,
  canInviteSpeaker,
  canManageParticipants,
  canStartPrayerSession,
  canManageTeam,
  deriveSessionRoleFromOrgRole,
  type OrganizationRole,
  type SessionRole,
} from '../shared/roles.ts';
import { membershipRepository } from './repositories/index.ts';

export interface ActorContext {
  userId: string | null;
  organizationId: string | null;
  orgRole: OrganizationRole | null;
}

export async function resolveActor(organizationId: string | null, userId: string | null): Promise<ActorContext> {
  if (!organizationId || !userId) {
    return { userId, organizationId, orgRole: null };
  }
  const membership = await membershipRepository.find(organizationId, userId);
  if (!membership || membership.status !== 'ACTIVE') {
    return { userId, organizationId, orgRole: null };
  }
  return { userId, organizationId, orgRole: membership.role };
}

export function requireOrgPermission(
  actor: ActorContext,
  allowed: (role: OrganizationRole) => boolean,
  message?: string
): OrganizationRole {
  if (!actor.orgRole || !allowed(actor.orgRole)) {
    throw Unauthorized(message);
  }
  return actor.orgRole;
}

export function requireCanCreateRoom(actor: ActorContext): OrganizationRole {
  return requireOrgPermission(actor, canCreatePrayerRoom, 'Not authorized to create prayer rooms');
}

export function requireCanStartSession(actor: ActorContext): OrganizationRole {
  return requireOrgPermission(actor, canStartPrayerSession, 'Not authorized to start prayer sessions');
}

export function requireCanManageParticipants(actor: ActorContext): OrganizationRole {
  return requireOrgPermission(actor, canManageParticipants, 'Not authorized to manage participants');
}

export function requireCanInviteSpeaker(actor: ActorContext): OrganizationRole {
  return requireOrgPermission(actor, canInviteSpeaker, 'Not authorized to invite speakers');
}

export function requireCanManageTeam(actor: ActorContext): OrganizationRole {
  return requireOrgPermission(actor, canManageTeam, 'Not authorized to manage church staff');
}

export function sessionRoleForJoin(orgRole: OrganizationRole | null, requestedRole: unknown): SessionRole {
  void requestedRole;
  return deriveSessionRoleFromOrgRole(orgRole);
}
