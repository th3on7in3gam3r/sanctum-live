import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { RealtimeUnavailable, RoomNotFound, Unauthorized } from '../../shared/errors.ts';
import { assertCanTransitionSession, type SessionLifecycleState } from '../../shared/sessionStateMachine.ts';
import { isLiveKitConfigured } from '../env.ts';
import { sendError } from '../http.ts';
import { resolveJoinRealtimeIdentity } from '../identity.ts';
import { getLiveKitProvider } from '../realtime/livekitProvider.ts';
import { mintLiveKitAccessToken } from '../realtime/tokenService.ts';
import {
  auditRepository,
  participantRepository,
  prayerRoomRepository,
  raisedHandRepository,
  sessionRepository,
} from '../repositories/index.ts';
import { createSpeakerFloorService } from '../services/createSpeakerFloorService.ts';
import {
  readActorHeaders,
  requireCanInviteSpeaker,
  requireCanManageParticipants,
  requireCanStartSession,
  resolveActor,
  sessionRoleForJoin,
} from '../authz.ts';

async function actorFromRequest(req: Request, organizationId?: string | null) {
  const headers = readActorHeaders(req.headers as Record<string, unknown>);
  return resolveActor(organizationId ?? headers.organizationId, headers.userId);
}

export async function createPrayerSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const prayerRoomId = String(req.body?.prayerRoomId || '');
    const room = await prayerRoomRepository.findById(prayerRoomId);
    if (!room) throw RoomNotFound(prayerRoomId);

    const actor = await actorFromRequest(req, room.organizationId);
    requireCanStartSession(actor);

    const livekitRoomName = `session_${randomUUID()}`;
    if (isLiveKitConfigured()) {
      await getLiveKitProvider().createRoom(livekitRoomName);
    }

    const session = await sessionRepository.create({
      prayerRoomId,
      status: 'SCHEDULED',
      scheduledStart: req.body?.scheduledStart ? new Date(req.body.scheduledStart) : null,
      livekitRoomName,
    });

    res.status(201).json({ session, realtimeConfigured: isLiveKitConfigured() });
  } catch (error) {
    sendError(res, error);
  }
}

export async function startPrayerSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);

    const actor = await actorFromRequest(req, room.organizationId);
    requireCanStartSession(actor);

    const advanceToLive = async (from: SessionLifecycleState) => {
      let current = from;
      if (current === 'SCHEDULED') {
        assertCanTransitionSession(current, 'WAITING');
        await sessionRepository.update(session.id, { status: 'WAITING' });
        current = 'WAITING';
      }
      if (current === 'WAITING') {
        assertCanTransitionSession(current, 'STARTING');
        await sessionRepository.update(session.id, { status: 'STARTING' });
        current = 'STARTING';
      }
      if (current === 'STARTING') {
        assertCanTransitionSession(current, 'LIVE');
        return sessionRepository.update(session.id, {
          status: 'LIVE',
          actualStart: session.actualStart ?? new Date(),
        });
      }
      assertCanTransitionSession(current, 'LIVE');
      return session;
    };

    const live = await advanceToLive(session.status);
    await auditRepository.write({
      organizationId: room.organizationId,
      sessionId: live.id,
      actorId: actor.userId,
      action: 'SESSION_STARTED',
    });
    res.json({ session: live });
  } catch (error) {
    sendError(res, error);
  }
}

export async function endPrayerSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);

    const actor = await actorFromRequest(req, room.organizationId);
    requireCanStartSession(actor);

    if (session.status === 'LIVE') {
      assertCanTransitionSession('LIVE', 'ENDING');
      await sessionRepository.update(session.id, { status: 'ENDING' });
    }
    if (session.status === 'LIVE' || session.status === 'ENDING') {
      assertCanTransitionSession('ENDING', 'ENDED');
    } else {
      assertCanTransitionSession(session.status, 'ENDED');
    }

    const ended = await sessionRepository.update(session.id, {
      status: 'ENDED',
      endedAt: new Date(),
    });

    if (isLiveKitConfigured() && ended.livekitRoomName) {
      await getLiveKitProvider().deleteRoom(ended.livekitRoomName);
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

export async function joinSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);

    const headers = readActorHeaders(req.headers as Record<string, unknown>);
    const userId = typeof req.body?.userId === 'string' ? req.body.userId : headers.userId;
    const guestName = typeof req.body?.guestName === 'string' ? req.body.guestName.trim() : '';
    const actor = await resolveActor(room.organizationId, userId);

    const sessionRole = sessionRoleForJoin(actor.orgRole, req.body?.role);
    const realtimeIdentity = resolveJoinRealtimeIdentity(
      actor.userId,
      typeof req.body?.realtimeIdentity === 'string' ? req.body.realtimeIdentity : undefined
    );

    if (!actor.userId && !guestName) {
      throw Unauthorized('A guest name is required to join as a visitor');
    }

    const existing = await participantRepository.findByRealtimeIdentity(session.id, realtimeIdentity);
    const participant = existing
      ? existing
      : await participantRepository.create({
          sessionId: session.id,
          userId: actor.userId,
          guestName: actor.userId ? null : guestName,
          realtimeIdentity,
          role: sessionRole,
        });

    await auditRepository.write({
      organizationId: room.organizationId,
      sessionId: session.id,
      actorId: actor.userId,
      action: 'PARTICIPANT_JOINED',
      targetId: participant.id,
    });

    let token: string | null = null;
    if (isLiveKitConfigured()) {
      if (!session.livekitRoomName) throw RealtimeUnavailable();
      token = await mintLiveKitAccessToken({
        roomName: session.livekitRoomName,
        identity: participant.realtimeIdentity,
        name: guestName || actor.userId || participant.realtimeIdentity,
        sessionRole: participant.role,
        holdsSpeakerFloor: session.activeSpeakerParticipantId === participant.id,
      });
    }

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
      livekitUrl: isLiveKitConfigured() ? process.env.LIVEKIT_URL : null,
      realtimeConfigured: isLiveKitConfigured(),
    });
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
    const hand = await raisedHandRepository.create(session.id, participant.id);
    await auditRepository.write({
      sessionId: session.id,
      action: 'HAND_RAISED',
      targetId: participant.id,
    });
    res.status(201).json({ raisedHand: hand });
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
    const result = await floor.invite({
      sessionId: session.id,
      participantId: String(req.body?.participantId || ''),
      actorId: actor.userId,
    });
    res.json({ speakerFloor: result });
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
    requireCanInviteSpeaker(actor);
    const floor = createSpeakerFloorService();
    const result = await floor.revoke({
      sessionId: session.id,
      participantId: req.body?.participantId ? String(req.body.participantId) : undefined,
      actorId: actor.userId,
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
    res.json({ speakerFloor: result });
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

    res.json({ removed: true, participantId: participant.id });
  } catch (error) {
    sendError(res, error);
  }
}
