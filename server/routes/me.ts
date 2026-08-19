import type { Request, Response } from 'express';
import { Unauthorized } from '../../shared/errors.ts';
import { sendError } from '../http.ts';
import { resolveActorFromRequest, resolvePrismaUserFromClerk } from '../clerkAuth.ts';
import { membershipRepository, userRepository } from '../repositories/index.ts';
import { getPrisma } from '../prisma.ts';

export async function meHandler(req: Request, res: Response): Promise<void> {
  try {
    const prismaUser = await resolvePrismaUserFromClerk(req);
    if (!prismaUser) {
      throw Unauthorized('Sign in with a church staff email your pastor added to the team.');
    }
    const actor = await resolveActorFromRequest(req);
    if (!actor.orgRole || !actor.organizationId) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'This Clerk account is not a member of a church organization.',
      });
      return;
    }

    const prisma = getPrisma();
    const organization = prisma
      ? await prisma.organization.findUnique({ where: { id: actor.organizationId } })
      : null;
    const user = await userRepository.findById(prismaUser.id);
    const memberships = await membershipRepository.listActiveByUser(prismaUser.id);

    res.json({
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: actor.orgRole,
        organizationId: actor.organizationId,
      },
      organization,
      memberships,
    });
  } catch (error) {
    sendError(res, error);
  }
}
