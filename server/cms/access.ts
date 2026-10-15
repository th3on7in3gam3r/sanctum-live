import { CmsNotFound, Unauthorized } from '../../shared/errors.ts';
import type { ActorContext } from '../authz.ts';

export function requireOrganization(actor: ActorContext): asserts actor is ActorContext & { organizationId: string; userId: string } {
  if (!actor.userId || !actor.organizationId || !actor.orgRole) {
    throw Unauthorized('Sign in with a church staff account.');
  }
}

export function requireCmsAdmin(actor: ActorContext): void {
  requireOrganization(actor);
  if (actor.orgRole !== 'OWNER' && actor.orgRole !== 'ADMIN') {
    throw Unauthorized('Church records are managed by the Owner or an Admin.');
  }
}

export function requireMemberReader(actor: ActorContext): void {
  requireOrganization(actor);
  if (actor.orgRole !== 'OWNER' && actor.orgRole !== 'ADMIN' && actor.orgRole !== 'PRAYER_LEADER') {
    throw Unauthorized('You cannot view the church directory.');
  }
}

export function assertInOrganization<T extends { organizationId: string }>(
  record: T | null | undefined,
  organizationId: string
): T {
  if (!record || record.organizationId !== organizationId) throw CmsNotFound();
  return record;
}

export function assertCanEditGroup(
  actor: ActorContext,
  group: { organizationId: string; leader: { userId: string | null } | null } | null
): void {
  requireOrganization(actor);
  const scoped = assertInOrganization(group, actor.organizationId);
  if (actor.orgRole === 'OWNER' || actor.orgRole === 'ADMIN') return;
  if (actor.orgRole === 'PRAYER_LEADER' && scoped.leader?.userId === actor.userId) return;
  throw Unauthorized('You can only manage groups you lead.');
}
