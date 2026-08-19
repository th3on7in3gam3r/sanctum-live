/**
 * Clerk mints the session. OrganizationMembership rows remain the ACL.
 * Spoofable `x-user-id` headers are ignored.
 */
import type { Request } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import { isClerkConfigured } from './env.ts';
import { membershipRepository, userRepository, type UserRecord } from './repositories/index.ts';
import { resolveActor, type ActorContext } from './authz.ts';

export async function resolveActorFromRequest(
  req: Request,
  organizationId?: string | null
): Promise<ActorContext> {
  const prismaUser = await resolvePrismaUserFromClerk(req);
  if (!prismaUser) {
    return { userId: null, organizationId: organizationId ?? null, orgRole: null };
  }
  const memberships = await membershipRepository.listActiveByUser(prismaUser.id);
  const requestedOrg =
    typeof organizationId === 'string' && organizationId
      ? organizationId
      : typeof req.headers['x-organization-id'] === 'string'
        ? req.headers['x-organization-id']
        : null;
  const membership =
    memberships.find((row) => row.organizationId === requestedOrg) || memberships[0] || null;
  if (!membership) {
    return { userId: prismaUser.id, organizationId: requestedOrg, orgRole: null };
  }
  return resolveActor(membership.organizationId, prismaUser.id);
}

export async function resolvePrismaUserFromClerk(req: Request): Promise<UserRecord | null> {
  if (!isClerkConfigured()) return null;
  let clerkUserId: string | null = null;
  try {
    const auth = getAuth(req);
    clerkUserId = auth.userId ?? null;
  } catch {
    return null;
  }
  if (!clerkUserId) return null;

  const existing = await userRepository.findByClerkUserId(clerkUserId);
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email = clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress
    || clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const byEmail = await userRepository.findByEmail(email.toLowerCase());
  if (!byEmail) return null;
  if (!byEmail.clerkUserId) {
    await userRepository.setClerkUserId(byEmail.id, clerkUserId);
  }
  return { ...byEmail, clerkUserId };
}
