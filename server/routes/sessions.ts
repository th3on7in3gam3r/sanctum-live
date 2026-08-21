import type { Request, Response } from 'express';
import {
  InvitationInvalid,
  RealtimeUnavailable,
  RoomNotFound,
  SessionNotJoinable,
  SessionNotLive,
  Unauthorized,
} from '../../shared/errors.ts';
import { deriveSessionRoleFromOrgRole } from '../../shared/roles.ts';
import { assertCanTransitionSession, isJoinableSessionStatus } from '../../shared/sessionStateMachine.ts';
import { isLiveKitConfigured } from '../env.ts';
import { sendError } from '../http.ts';
import { getPrisma } from '../prisma.ts';
import { resolveJoinRealtimeIdentity } from '../identity.ts';
import { broadcastSessionEvent, ensureLiveKitRoom } from '../realtime/ensureLiveKitRoom.ts';
import { getLiveKitProvider } from '../realtime/livekitProvider.ts';
import { mintLiveKitAccessToken } from '../realtime/tokenService.ts';
import {
  auditRepository,
  participantRepository,
  prayerRoomRepository,
  raisedHandRepository,
  sessionRepository,
  speakerInvitationRepository,
} from '../repositories/index.ts';
import { createSpeakerFloorService } from '../services/createSpeakerFloorService.ts';
import {
  requireCanInviteSpeaker,
  requireCanManageParticipants,
  requireCanMuteCongregation,
  requireCanStartSession,
  resolveActor,
  sessionRoleForJoin,
} from '../authz.ts';
import { resolveActorFromRequest } from '../clerkAuth.ts';

const ROOM_DELETE_DELAY_MS = 4_000;

async function actorFromRequest(req: Request, organizationId?: string | null) {
  return resolveActorFromRequest(req, organizationId);
}

export async function createPrayerSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const prayerRoomId = String(req.body?.prayerRoomId || '');
    const room = await prayerRoomRepository.findById(prayerRoomId);
    if (!room) throw RoomNotFound(prayerRoomId);

    const actor = await actorFromRequest(req, room.organizationId);
    requireCanStartSession(actor);

    const session = await sessionRepository.create({
      prayerRoomId,
      status: 'SCHEDULED',
      scheduledStart: req.body?.scheduledStart ? new Date(req.body.scheduledStart) : null,
    });

    res.status(201).json({ session, realtimeConfigured: isLiveKitConfigured() });
  } catch (error) {
    sendError(res, error);
  }
}

export async function openPrayerSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const roomId = typeof req.body?.prayerRoomId === 'string' ? req.body.prayerRoomId : '';
    let session = req.params.id ? await sessionRepository.findById(req.params.id) : null;

    if (!session && roomId) {
      session = await sessionRepository.findOpenableByRoom(roomId);
      if (!session) {
        const room = await prayerRoomRepository.findById(roomId);
        if (!room) throw RoomNotFound(roomId);
        const actor = await actorFromRequest(req, room.organizationId);
        requireCanStartSession(actor);
        session = await sessionRepository.create({ prayerRoomId: roomId, status: 'SCHEDULED' });
      }
    }

    if (!session) {
      session = await sessionRepository.requireById(req.params.id);
    }

    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);
    const actor = await actorFromRequest(req, room.organizationId);
    requireCanStartSession(actor);

    if (session.status === 'SCHEDULED') {
      assertCanTransitionSession('SCHEDULED', 'WAITING');
      session = await sessionRepository.update(session.id, { status: 'WAITING' });
    } else if (session.status !== 'WAITING') {
      assertCanTransitionSession(session.status, 'WAITING');
    }

    session = await ensureLiveKitRoom(session);
    await broadcastSessionEvent(session.livekitRoomName, 'SANCTUARY_OPENED', { sessionId: session.id });

    res.json({ session, realtimeConfigured: isLiveKitConfigured() });
  } catch (error) {
    sendError(res, error);
  }
}

export async function startPrayerSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    let session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);

    const actor = await actorFromRequest(req, room.organizationId);
    requireCanStartSession(actor);

    if (session.status === 'SCHEDULED') {
      throw SessionNotJoinable(session.status);
    }

    session = await ensureLiveKitRoom(session);

    if (session.status === 'WAITING') {
      assertCanTransitionSession('WAITING', 'STARTING');
      session = await sessionRepository.update(session.id, { status: 'STARTING' });
    }
    if (session.status === 'STARTING') {
      assertCanTransitionSession('STARTING', 'LIVE');
      session = await sessionRepository.update(session.id, {
        status: 'LIVE',
        actualStart: session.actualStart ?? new Date(),
      });
    } else if (session.status !== 'LIVE') {
      assertCanTransitionSession(session.status, 'LIVE');
    }

    await auditRepository.write({
      organizationId: room.organizationId,
      sessionId: session.id,
      actorId: actor.userId,
      action: 'SESSION_STARTED',
    });
    await broadcastSessionEvent(session.livekitRoomName, 'SESSION_STARTED', { sessionId: session.id });
    res.json({ session });
  } catch (error) {
    sendError(res, error);
  }
}

export async function endPrayerSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    let session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);

    const actor = await actorFromRequest(req, room.organizationId);
    requireCanStartSession(actor);

    if (session.status === 'LIVE') {
      assertCanTransitionSession('LIVE', 'ENDING');
      session = await sessionRepository.update(session.id, { status: 'ENDING' });
    }

    if (session.activeSpeakerParticipantId) {
      const floor = createSpeakerFloorService();
      await floor.revoke({ sessionId: session.id, actorId: actor.userId });
    }

    await broadcastSessionEvent(session.livekitRoomName, 'SESSION_ENDED', { sessionId: session.id });

    if (session.status === 'ENDING' || session.status === 'LIVE') {
      assertCanTransitionSession('ENDING', 'ENDED');
    } else if (session.status === 'WAITING' || session.status === 'STARTING' || session.status === 'SCHEDULED') {
      assertCanTransitionSession(session.status, 'CANCELLED');
      session = await sessionRepository.update(session.id, {
        status: 'CANCELLED',
        endedAt: new Date(),
      });
      await auditRepository.write({
        organizationId: room.organizationId,
        sessionId: session.id,
        actorId: actor.userId,
        action: 'SESSION_CANCELLED',
      });
      res.json({ session });
      return;
    }

    const ended = await sessionRepository.update(session.id, {
      status: 'ENDED',
      endedAt: new Date(),
    });

    const roomName = ended.livekitRoomName;
    if (isLiveKitConfigured() && roomName) {
      setTimeout(() => {
        void getLiveKitProvider().deleteRoom(roomName);
      }, ROOM_DELETE_DELAY_MS);
    }

    await auditRepository.write({
      organizationId: room.organizationId,
      sessionId: ended.id,
      actorId: actor.userId,
      action: 'SESSION_ENDED',
    });

    res.json({ session: ended });
  } catch (error) {
    sendError(res, error);
  }
}

export async function getSessionSnapshotHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    const participants = await participantRepository.listBySession(session.id);
    const raisedHands = await raisedHandRepository.listWaiting(session.id);
    const invitations = await speakerInvitationRepository.listPending(session.id);
    const speaker = session.activeSpeakerParticipantId
      ? await participantRepository.findById(session.activeSpeakerParticipantId)
      : null;

    let connectedNow = participants.filter((p) => !p.leftAt).length;
    if (isLiveKitConfigured() && session.livekitRoomName) {
      const live = await getLiveKitProvider().listParticipants(session.livekitRoomName);
      connectedNow = live.length;
    }

    res.json({
      session,
      room: room ? { id: room.id, name: room.name, slug: room.slug, organizationId: room.organizationId } : null,
      activeSpeaker: speaker,
      participants,
      raisedHands,
      invitations,
      connectedNow,
      peakConcurrentParticipants: session.peakConcurrentParticipants,
      realtimeConfigured: isLiveKitConfigured(),
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function listLiveAltarsHandler(req: Request, res: Response): Promise<void> {
  try {
    const prisma = getPrisma();
    if (!prisma) {
      res.json({ rooms: [] });
      return;
    }

    const organizationSlug =
      typeof req.query.organization === 'string' ? req.query.organization.trim().toLowerCase() : '';

    const sessions = await prisma.prayerSession.findMany({
      where: {
        status: 'LIVE',
        ...(organizationSlug
          ? { prayerRoom: { organization: { slug: organizationSlug } } }
          : {}),
      },
      include: {
        prayerRoom: {
          select: {
            name: true,
            slug: true,
            organization: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { actualStart: 'desc' },
    });

    res.json({
      rooms: sessions.map((session) => ({
        slug: session.prayerRoom.slug,
        name: session.prayerRoom.name,
        organizationName: session.prayerRoom.organization.name,
        organizationSlug: session.prayerRoom.organization.slug,
        sessionId: session.id,
        status: session.status,
      })),
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function getAltarBySlugHandler(req: Request, res: Response): Promise<void> {
  try {
    const room = await prayerRoomRepository.findPublicAltarBySlug(req.params.slug);
    if (!room) throw RoomNotFound(req.params.slug);
    const session = await sessionRepository.findJoinableByRoom(room.id);
    res.json({
      room: {
        id: room.id,
        name: room.name,
        slug: room.slug,
        organizationId: room.organizationId,
        organizationName: room.organization.name,
        scheduledStart: room.scheduledStart,
        timezone: room.timezone,
      },
      session,
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function joinSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    if (!isJoinableSessionStatus(session.status)) throw SessionNotJoinable(session.status);

    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);

    if (!isLiveKitConfigured() || !session.livekitRoomName) {
      throw RealtimeUnavailable();
    }

    const asGuest = req.body?.asGuest === true;
    const guestName = typeof req.body?.guestName === 'string' ? req.body.guestName.trim() : '';
    const actor = asGuest
      ? { userId: null, organizationId: room.organizationId, orgRole: null }
      : await actorFromRequest(req, room.organizationId);

    const sessionRole = sessionRoleForJoin(actor.orgRole, req.body?.role);
    const realtimeIdentity = resolveJoinRealtimeIdentity(
      actor.userId,
      typeof req.body?.realtimeIdentity === 'string' ? req.body.realtimeIdentity : undefined
    );

    if (!actor.userId && !guestName) {
      throw Unauthorized('A guest name is required to join as a visitor');
    }

    let participant = await participantRepository.findByRealtimeIdentity(session.id, realtimeIdentity);
    if (participant) {
      if (participant.leftAt) {
        participant = await participantRepository.markRejoined(participant.id);
      }
    } else {
      participant = await participantRepository.create({
        sessionId: session.id,
        userId: actor.userId,
        guestName: actor.userId ? null : guestName,
        realtimeIdentity,
        role: sessionRole,
        baseRole: sessionRole,
      });
    }

    await auditRepository.write({
      organizationId: room.organizationId,
      sessionId: session.id,
      actorId: actor.userId,
      action: 'PARTICIPANT_JOINED',
      targetId: participant.id,
    });

    const displayName = guestName || (actor.userId ? participant.guestName : null) || participant.realtimeIdentity;
    const token = await mintLiveKitAccessToken({
      roomName: session.livekitRoomName,
      identity: participant.realtimeIdentity,
      name: displayName || participant.realtimeIdentity,
      sessionRole: participant.role,
      holdsSpeakerFloor: session.activeSpeakerParticipantId === participant.id,
      congregationMuted: session.congregationMuted !== false,
    });

    await broadcastSessionEvent(session.livekitRoomName, 'PARTICIPANT_JOINED', {
      sessionId: session.id,
      participantId: participant.id,
    });

    res.status(201).json({
      participant: {
        id: participant.id,
        sessionId: participant.sessionId,
        role: participant.role,
        realtimeIdentity: participant.realtimeIdentity,
        guestName: participant.guestName,
        userId: participant.userId,
      },
      token,
      livekitUrl: process.env.LIVEKIT_URL || null,
      realtimeConfigured: true,
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function leaveSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const participantId = String(req.body?.participantId || '');
    const participant = await participantRepository.requireById(participantId);
    if (participant.sessionId !== session.id) throw Unauthorized('Participant does not belong to this session');
    await participantRepository.markLeft(participant.id);
    await broadcastSessionEvent(session.livekitRoomName, 'PARTICIPANT_LEFT', {
      sessionId: session.id,
      participantId: participant.id,
    });
    res.json({ left: true, participantId: participant.id });
  } catch (error) {
    sendError(res, error);
  }
}

export async function raiseHandHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const participantId = String(req.body?.participantId || '');
    const participant = await participantRepository.requireById(participantId);
    if (participant.sessionId !== session.id) {
      throw Unauthorized('Participant does not belong to this session');
    }
    const hand = await raisedHandRepository.upsertWaiting(session.id, participant.id);
    await auditRepository.write({
      sessionId: session.id,
      action: 'HAND_RAISED',
      targetId: participant.id,
    });
    await broadcastSessionEvent(session.livekitRoomName, 'HAND_RAISED', {
      sessionId: session.id,
      participantId: participant.id,
      displayName: participant.guestName || participant.realtimeIdentity,
      raisedHandId: hand.id,
    });
    res.status(201).json({ raisedHand: hand });
  } catch (error) {
    sendError(res, error);
  }
}

export async function lowerHandHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const participantId = String(req.body?.participantId || '');
    const hand = await raisedHandRepository.findOpenForParticipant(session.id, participantId);
    if (hand) {
      await raisedHandRepository.updateStatus(hand.id, 'DISMISSED');
    }
    await broadcastSessionEvent(session.livekitRoomName, 'HAND_LOWERED', {
      sessionId: session.id,
      participantId,
    });
    res.json({ lowered: true });
  } catch (error) {
    sendError(res, error);
  }
}

export async function dismissHandHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);
    const actor = await actorFromRequest(req, room.organizationId);
    requireCanInviteSpeaker(actor);
    const hand = await raisedHandRepository.findById(req.params.handId);
    if (!hand || hand.sessionId !== session.id) throw Unauthorized('Raised hand not found');
    await raisedHandRepository.updateStatus(hand.id, 'DISMISSED');
    await broadcastSessionEvent(session.livekitRoomName, 'HAND_DISMISSED', {
      sessionId: session.id,
      raisedHandId: hand.id,
      participantId: hand.participantId,
    });
    res.json({ dismissed: true });
  } catch (error) {
    sendError(res, error);
  }
}

export async function inviteSpeakerHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);
    const actor = await actorFromRequest(req, room.organizationId);
    requireCanInviteSpeaker(actor);
    const floor = createSpeakerFloorService();
    const participantId = String(req.body?.participantId || '');
    const result = await floor.invite({
      sessionId: session.id,
      participantId,
      actorId: actor.userId,
    });
    const hand = await raisedHandRepository.findOpenForParticipant(session.id, participantId);
    if (hand) await raisedHandRepository.updateStatus(hand.id, 'INVITED');
    const participant = await participantRepository.requireById(participantId);
    await broadcastSessionEvent(session.livekitRoomName, 'SPEAKER_INVITED', {
      sessionId: session.id,
      participantId,
      invitationId: result.invitationId,
      realtimeIdentity: participant.realtimeIdentity,
    });
    res.json({ speakerFloor: result, invitationId: result.invitationId });
  } catch (error) {
    sendError(res, error);
  }
}

export async function acceptSpeakerHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    if (session.status !== 'LIVE') throw SessionNotLive();
    const invitationId = typeof req.body?.invitationId === 'string' ? req.body.invitationId : '';
    const participantId = String(req.body?.participantId || '');
    const invitation = invitationId
      ? await speakerInvitationRepository.findById(invitationId)
      : await speakerInvitationRepository.findPendingForParticipant(session.id, participantId);

    if (!invitation || invitation.sessionId !== session.id || invitation.status !== 'PENDING') {
      throw InvitationInvalid();
    }

    const participant = await participantRepository.requireById(invitation.participantId);
    const claimedIdentity =
      typeof req.body?.realtimeIdentity === 'string' ? req.body.realtimeIdentity : '';
    if (claimedIdentity && claimedIdentity !== participant.realtimeIdentity) {
      throw Unauthorized('Invitation does not match this participant');
    }

    const inviterRole = invitation.invitedById
      ? deriveSessionRoleFromOrgRole(
          (await resolveActor(
            (await prayerRoomRepository.findById(session.prayerRoomId))?.organizationId ?? null,
            invitation.invitedById
          )).orgRole
        )
      : 'HOST';
    void inviterRole;

    const floor = createSpeakerFloorService();
    const result = session.activeSpeakerParticipantId && session.activeSpeakerParticipantId !== participant.id
      ? await floor.transfer({ sessionId: session.id, toParticipantId: participant.id, actorId: invitation.invitedById })
      : await floor.grant({ sessionId: session.id, participantId: participant.id, actorId: invitation.invitedById });

    await speakerInvitationRepository.updateStatus(invitation.id, 'ACCEPTED');
    const hand = await raisedHandRepository.findOpenForParticipant(session.id, participant.id);
    if (hand) await raisedHandRepository.updateStatus(hand.id, 'RESOLVED');

    await broadcastSessionEvent(session.livekitRoomName, 'FLOOR_CHANGED', {
      sessionId: session.id,
      activeSpeakerParticipantId: result.activeSpeakerParticipantId,
      participantId: participant.id,
    });

    res.json({ speakerFloor: result, invitationId: invitation.id });
  } catch (error) {
    sendError(res, error);
  }
}

export async function declineSpeakerHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const participantId = String(req.body?.participantId || '');
    const invitation = await speakerInvitationRepository.findPendingForParticipant(session.id, participantId);
    if (invitation) await speakerInvitationRepository.updateStatus(invitation.id, 'DECLINED');
    const hand = await raisedHandRepository.findOpenForParticipant(session.id, participantId);
    if (hand) await raisedHandRepository.updateStatus(hand.id, 'WAITING');
    await broadcastSessionEvent(session.livekitRoomName, 'SPEAKER_DECLINED', {
      sessionId: session.id,
      participantId,
    });
    res.json({ declined: true });
  } catch (error) {
    sendError(res, error);
  }
}

export async function grantSpeakerHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);
    const actor = await actorFromRequest(req, room.organizationId);
    requireCanInviteSpeaker(actor);
    const floor = createSpeakerFloorService();
    const result = await floor.grant({
      sessionId: session.id,
      participantId: String(req.body?.participantId || ''),
      actorId: actor.userId,
    });
    await broadcastSessionEvent(session.livekitRoomName, 'FLOOR_CHANGED', {
      sessionId: session.id,
      activeSpeakerParticipantId: result.activeSpeakerParticipantId,
    });
    res.json({ speakerFloor: result });
  } catch (error) {
    sendError(res, error);
  }
}

export async function revokeSpeakerHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);
    const actor = await actorFromRequest(req, room.organizationId);
    const participantId = req.body?.participantId ? String(req.body.participantId) : undefined;
    const target = participantId
      ? await participantRepository.requireById(participantId)
      : session.activeSpeakerParticipantId
        ? await participantRepository.findById(session.activeSpeakerParticipantId)
        : null;
    const isSelf =
      Boolean(target) &&
      (actor.userId === target?.userId ||
        (typeof req.body?.realtimeIdentity === 'string' &&
          req.body.realtimeIdentity === target?.realtimeIdentity));

    if (!isSelf) {
      requireCanInviteSpeaker(actor);
    }

    const floor = createSpeakerFloorService();
    const result = await floor.revoke({
      sessionId: session.id,
      participantId,
      actorId: actor.userId,
    });
    if (participantId) {
      const invitation = await speakerInvitationRepository.findPendingForParticipant(session.id, participantId);
      if (invitation) await speakerInvitationRepository.updateStatus(invitation.id, 'REVOKED');
    }
    await broadcastSessionEvent(session.livekitRoomName, 'FLOOR_CHANGED', {
      sessionId: session.id,
      activeSpeakerParticipantId: null,
    });
    res.json({ speakerFloor: result });
  } catch (error) {
    sendError(res, error);
  }
}

export async function transferSpeakerHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);
    const actor = await actorFromRequest(req, room.organizationId);
    requireCanInviteSpeaker(actor);
    const floor = createSpeakerFloorService();
    const result = await floor.transfer({
      sessionId: session.id,
      toParticipantId: String(req.body?.participantId || req.body?.toParticipantId || ''),
      actorId: actor.userId,
    });
    await broadcastSessionEvent(session.livekitRoomName, 'FLOOR_CHANGED', {
      sessionId: session.id,
      activeSpeakerParticipantId: result.activeSpeakerParticipantId,
    });
    res.json({ speakerFloor: result });
  } catch (error) {
    sendError(res, error);
  }
}

export async function muteParticipantHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);
    const actor = await actorFromRequest(req, room.organizationId);
    requireCanInviteSpeaker(actor);
    const participant = await participantRepository.requireById(String(req.body?.participantId || req.params.participantId || ''));
    if (participant.sessionId !== session.id) throw Unauthorized('Participant does not belong to this session');
    if (isLiveKitConfigured() && session.livekitRoomName) {
      const provider = getLiveKitProvider();
      try {
        await provider.muteParticipant(session.livekitRoomName, participant.realtimeIdentity);
        const isMinister = participant.role === 'HOST' || participant.role === 'MODERATOR';
        if (!isMinister) {
          await provider.updatePublishPermission(session.livekitRoomName, participant.realtimeIdentity, false);
        }
      } catch {
        /* Participant may not be connected to LiveKit yet. */
      }
    }
    await broadcastSessionEvent(session.livekitRoomName, 'PARTICIPANT_MUTED', {
      sessionId: session.id,
      participantId: participant.id,
      muted: true,
    });
    res.json({ muted: true, participantId: participant.id, floorRetained: session.activeSpeakerParticipantId === participant.id });
  } catch (error) {
    sendError(res, error);
  }
}

export async function unmuteParticipantHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);
    const actor = await actorFromRequest(req, room.organizationId);
    requireCanInviteSpeaker(actor);
    const participant = await participantRepository.requireById(String(req.body?.participantId || req.params.participantId || ''));
    if (participant.sessionId !== session.id) throw Unauthorized('Participant does not belong to this session');
    if (isLiveKitConfigured() && session.livekitRoomName) {
      const provider = getLiveKitProvider();
      const isMinister = participant.role === 'HOST' || participant.role === 'MODERATOR';
      const canPublish = isMinister || session.congregationMuted === false;
      try {
        await provider.updatePublishPermission(session.livekitRoomName, participant.realtimeIdentity, canPublish);
        if (canPublish) {
          await provider.unmuteParticipant(session.livekitRoomName, participant.realtimeIdentity);
        }
      } catch {
        /* Participant may not be connected to LiveKit yet. */
      }
    }
    await broadcastSessionEvent(session.livekitRoomName, 'PARTICIPANT_MUTED', {
      sessionId: session.id,
      participantId: participant.id,
      muted: false,
    });
    res.json({ muted: false, participantId: participant.id, floorRetained: session.activeSpeakerParticipantId === participant.id });
  } catch (error) {
    sendError(res, error);
  }
}

export async function removeParticipantHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);
    const actor = await actorFromRequest(req, room.organizationId);
    requireCanManageParticipants(actor);

    const participant = await participantRepository.requireById(req.params.participantId);
    if (participant.sessionId !== session.id) {
      throw Unauthorized('Participant does not belong to this session');
    }

    if (session.activeSpeakerParticipantId === participant.id) {
      const floor = createSpeakerFloorService();
      await floor.revoke({ sessionId: session.id, participantId: participant.id, actorId: actor.userId });
    }

    await participantRepository.markLeft(participant.id);
    if (isLiveKitConfigured() && session.livekitRoomName) {
      await getLiveKitProvider().removeParticipant(session.livekitRoomName, participant.realtimeIdentity);
    }

    await auditRepository.write({
      organizationId: room.organizationId,
      sessionId: session.id,
      actorId: actor.userId,
      action: 'PARTICIPANT_REMOVED',
      targetId: participant.id,
    });
    await broadcastSessionEvent(session.livekitRoomName, 'PARTICIPANT_REMOVED', {
      sessionId: session.id,
      participantId: participant.id,
    });

    res.json({ removed: true, participantId: participant.id });
  } catch (error) {
    sendError(res, error);
  }
}

export async function setCongregationMuteHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);
    const actor = await actorFromRequest(req, room.organizationId);
    requireCanMuteCongregation(actor);

    const congregationMuted = req.body?.muted === true;
    const updated = await sessionRepository.update(session.id, { congregationMuted });
    const participants = await participantRepository.listBySession(session.id);

    if (isLiveKitConfigured() && session.livekitRoomName) {
      const provider = getLiveKitProvider();
      for (const participant of participants) {
        if (participant.leftAt) continue;
        const isMinister = participant.role === 'HOST' || participant.role === 'MODERATOR';
        const canPublish = isMinister || !congregationMuted;
        try {
          await provider.updatePublishPermission(session.livekitRoomName, participant.realtimeIdentity, canPublish);
          if (congregationMuted && !isMinister) {
            await provider.muteParticipant(session.livekitRoomName, participant.realtimeIdentity);
          }
        } catch {
          /* Participant may not be connected to LiveKit yet. */
        }
      }
    }

    await auditRepository.write({
      organizationId: room.organizationId,
      sessionId: session.id,
      actorId: actor.userId,
      action: 'ROOM_UPDATED',
      targetId: session.id,
      metadata: { congregationMuted },
    });
    await broadcastSessionEvent(session.livekitRoomName, 'CONGREGATION_MUTED', {
      sessionId: session.id,
      muted: congregationMuted,
    });

    res.json({ session: updated });
  } catch (error) {
    sendError(res, error);
  }
}
