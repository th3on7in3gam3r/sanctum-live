import { Unauthorized } from '../shared/errors.ts';
import {
  canCreatePrayerRoom,
  canInviteSpeaker,
  canManageParticipants,
  canStartPrayerSession,
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

export function readActorHeaders(headers: Record<string, unknown>): { userId: string | null; organizationId: string | null } {
  const userId = typeof headers['x-user-id'] === 'string' ? headers['x-user-id'] : null;
  const organizationId = typeof headers['x-organization-id'] === 'string' ? headers['x-organization-id'] : null;
  return { userId, organizationId };
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

export function sessionRoleForJoin(orgRole: OrganizationRole | null, requestedRole: unknown): SessionRole {
  void requestedRole;
  return deriveSessionRoleFromOrgRole(orgRole);
}
