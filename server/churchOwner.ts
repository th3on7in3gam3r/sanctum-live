/**
 * First real Clerk user claims the church. Seeded emails like
 * kenneth@miraclecenter.org are placeholders until a Super Admin signs in.
 */
import { SEED_ORG_ID } from '../prisma/seedMemberships.ts';
import { getPrisma } from './prisma.ts';
import { membershipRepository, userRepository, type UserRecord } from './repositories/index.ts';

export async function claimChurchOwnerForClerkUser(input: {
  clerkUserId: string;
  email: string;
  name: string;
}): Promise<UserRecord | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const email = input.email.trim().toLowerCase();
  const name = input.name.trim() || email.split('@')[0] || 'Church Owner';

  const claimed = await claimUnlinkedOwner({ clerkUserId: input.clerkUserId, email, name });
  if (claimed) return claimed;

  const linkedOwners = await prisma.user.count({
    where: { clerkUserId: { not: null }, memberships: { some: { role: 'OWNER', status: 'ACTIVE' } } },
  });
  if (linkedOwners > 0) return null;

  const org =
    (await prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } })) ||
    (await prisma.organization.upsert({
      where: { id: SEED_ORG_ID },
      update: {},
      create: {
        id: SEED_ORG_ID,
        name: 'Miracle Center Kampala',
        slug: 'miracle-center-kampala',
        country: 'Uganda',
        timezone: 'Africa/Kampala',
        website: 'https://miraclecenter.org',
        primaryContactName: name,
        primaryContactEmail: email,
        joinPageMessage: 'Welcome to live prayer. Join your church family lifting one voice.',
      },
    }));

  let user = await userRepository.findByEmail(email);
  if (!user) {
    user = await userRepository.create({ name, email });
  }
  if (!user.clerkUserId) {
    await userRepository.setClerkUserId(user.id, input.clerkUserId);
  } else if (user.clerkUserId !== input.clerkUserId) {
    return null;
  }

  await membershipRepository.ensureActiveOwner(org.id, user.id);
  const linked = await userRepository.findById(user.id);
  return linked ? { ...linked, clerkUserId: input.clerkUserId } : null;
}

async function claimUnlinkedOwner(input: {
  clerkUserId: string;
  email: string;
  name: string;
}): Promise<UserRecord | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const membership = await prisma.organizationMembership.findFirst({
    where: { role: 'OWNER', status: 'ACTIVE', user: { clerkUserId: null } },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!membership) return null;

  const emailTaken = await prisma.user.findFirst({
    where: {
      email: { equals: input.email, mode: 'insensitive' },
      NOT: { id: membership.userId },
    },
  });

  const updated = await prisma.user.updateMany({
    where: { id: membership.userId, clerkUserId: null },
    data: {
      clerkUserId: input.clerkUserId,
      name: input.name || membership.user.name,
      ...(emailTaken ? {} : { email: input.email }),
    },
  });
  if (updated.count === 0) return null;

  return userRepository.findById(membership.userId);
}
