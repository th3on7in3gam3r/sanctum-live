import type { Request, Response } from 'express';
import { clerkClient } from '@clerk/express';
import { isInviteableOrgRole } from '../../shared/roles.ts';
import { Unauthorized } from '../../shared/errors.ts';
import { requireCanManageTeam } from '../authz.ts';
import { resolveActorFromRequest } from '../clerkAuth.ts';
import { env, isClerkConfigured } from '../env.ts';
import { sendError } from '../http.ts';
import { membershipRepository, userRepository } from '../repositories/index.ts';

export async function listTeamHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = await resolveActorFromRequest(req);
    requireCanManageTeam(actor);
    if (!actor.organizationId) throw Unauthorized();

    const members = await membershipRepository.listByOrganization(actor.organizationId);
    res.json({
      members: members.map((row) => ({
        userId: row.userId,
        name: row.user.name,
        email: row.user.email,
        role: row.role,
        status: row.status,
      })),
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function inviteTeamMemberHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = await resolveActorFromRequest(req);
    requireCanManageTeam(actor);
    if (!actor.organizationId) throw Unauthorized();

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const role = typeof req.body?.role === 'string' ? req.body.role.trim() : '';
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'INVALID_INVITE', message: 'A valid staff email is required.' });
      return;
    }
    if (!isInviteableOrgRole(role)) {
      res.status(400).json({
        error: 'INVALID_INVITE',
        message: 'Invite an Admin to help run this Sanctum Space.',
      });
      return;
    }

    let user = await userRepository.findByEmail(email);
    if (!user) {
      user = await userRepository.create({
        name: email.split('@')[0],
        email,
      });
    }

    const existing = await membershipRepository.find(actor.organizationId, user.id);
    if (existing?.status === 'ACTIVE') {
      res.status(409).json({
        error: 'ALREADY_MEMBER',
        message: 'That email is already on this church team.',
      });
      return;
    }

    const membership = await membershipRepository.upsertInvite({
      organizationId: actor.organizationId,
      userId: user.id,
      role,
    });

    let clerkInviteSent = false;
    if (isClerkConfigured()) {
      try {
        await clerkClient.invitations.createInvitation({
          emailAddress: email,
          redirectUrl: `${env.appUrl}/login`,
        });
        clerkInviteSent = true;
      } catch {
        clerkInviteSent = false;
      }
    }

    res.status(existing ? 200 : 201).json({
      member: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: membership.role,
        status: membership.status,
      },
      clerkInviteSent,
    });
  } catch (error) {
    sendError(res, error);
  }
}
