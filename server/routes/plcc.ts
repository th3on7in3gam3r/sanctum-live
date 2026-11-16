import type { Request, Response } from 'express';
import { RoomNotFound, SessionNotJoinable, Unauthorized } from '../../shared/errors.ts';
import { isJoinableSessionStatus } from '../../shared/sessionStateMachine.ts';
import { BROADCAST_PREFIX, BROADCAST_MAX } from '../../shared/broadcast.ts';
import { requireOrganization } from '../cms/access.ts';
import { resolveActorFromRequest } from '../clerkAuth.ts';
import { requireCanManageParticipants } from '../authz.ts';
import { sendError } from '../http.ts';
import { getPrisma } from '../prisma.ts';
import { DatabaseUnavailable } from '../../shared/errors.ts';
import { broadcastSessionEvent } from '../realtime/ensureLiveKitRoom.ts';
import {
  chatMessageRepository,
  prayerRoomRepository,
  sessionRepository,
  userRepository,
} from '../repositories/index.ts';

function canaanOrigin() {
  return String(process.env.PLCC_API_ORIGIN || 'https://plcc-opal.vercel.app').replace(/\/+$/, '');
}

export interface JordanRoomCount {
  id: string;
  name: string;
  live: boolean;
  count: number | null;
  capacity: number | null;
}

/**
 * GET /api/plcc/jordan-rooms — church staff only.
 * Jordan's open prayer rooms with how many people are in each right now. Counts come
 * from PLCC Canaan, which only gives them to this server (SANCTUM_SERVICE_KEY). The key
 * never reaches a browser. Without the key, rooms come back with count: null.
 */
export async function jordanRoomsHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = await resolveActorFromRequest(req);
    requireOrganization(actor);
    res.setHeader('Cache-Control', 'private, no-store');

    const key = String(process.env.SANCTUM_SERVICE_KEY || '').trim();
    let rooms: JordanRoomCount[] = [];
    let counts = false;
    try {
      const response = await fetch(`${canaanOrigin()}/api/vault?resource=live-prayer&rooms=1`, {
        headers: key ? { 'x-sanctum-key': key } : {},
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = (await response.json()) as { rooms?: unknown };
        const list = Array.isArray(data.rooms) ? data.rooms : [];
        rooms = list
          .filter((r: any) => r && typeof r.id === 'string' && typeof r.name === 'string')
          .map((r: any) => {
            const hasCount = typeof r.count === 'number';
            if (hasCount) counts = true;
            return {
              id: r.id,
              name: r.name,
              live: r.live === true,
              count: hasCount ? Math.max(0, Math.round(r.count)) : null,
              capacity: typeof r.capacity === 'number' ? r.capacity : null,
            };
          });
      }
    } catch {
      /* Canaan unreachable: answer with no rooms rather than an error. */
    }
    res.json({ rooms, counts, keyConfigured: Boolean(key) });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * POST /api/sessions/:id/broadcast — moderators only (can manage participants).
 * Sends one announcement to everyone in a live Sanctum prayer room: it appears as a
 * banner in the room and is kept in the room's chat so late joiners see it too.
 */
export async function broadcastHandler(req: Request, res: Response): Promise<void> {
  try {
    const session = await sessionRepository.requireById(req.params.id);
    if (!isJoinableSessionStatus(session.status)) throw SessionNotJoinable(session.status);
    const room = await prayerRoomRepository.findById(session.prayerRoomId);
    if (!room) throw RoomNotFound(session.prayerRoomId);
    const actor = await resolveActorFromRequest(req, room.organizationId);
    requireCanManageParticipants(actor);

    const body = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, BROADCAST_MAX) : '';
    if (!body) throw Unauthorized('Write a message to send.');

    const name = (actor.userId ? await userRepository.findNameById(actor.userId) : null)?.trim() || 'Moderator';
    const displayName = `${BROADCAST_PREFIX}${name}`.slice(0, 80);
    const message = await chatMessageRepository.create({ sessionId: session.id, displayName, body });
    const timestamp = message.createdAt.toISOString();

    await broadcastSessionEvent(session.livekitRoomName, 'BROADCAST_MESSAGE', {
      sessionId: session.id,
      displayName: name,
      timestamp,
      metadata: { body, messageId: message.id },
    });
    // Also show it in the room chat for people who have the chat open.
    await broadcastSessionEvent(session.livekitRoomName, 'CHAT_MESSAGE', {
      sessionId: session.id,
      displayName,
      timestamp,
      metadata: { body, messageId: message.id },
    });

    res.status(201).json({ sent: true, roomName: room.name, timestamp });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * GET /api/audit — moderators only. The organization's latest audit events (who did
 * what, in which prayer room), newest first. Read only.
 */
export async function auditListHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = await resolveActorFromRequest(req);
    requireOrganization(actor);
    requireCanManageParticipants(actor);
    const prisma = getPrisma();
    if (!prisma) throw DatabaseUnavailable();
    const take = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const rows = await prisma.auditEvent.findMany({
      where: { organizationId: actor.organizationId },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        actor: { select: { name: true } },
        session: { select: { prayerRoom: { select: { name: true } } } },
      },
    });
    // Participant names for targets that are participants (removed, invited to speak…).
    const targetIds = [...new Set(rows.map((r) => r.targetId).filter(Boolean))] as string[];
    const participants = targetIds.length
      ? await prisma.sessionParticipant.findMany({
          where: { id: { in: targetIds } },
          select: { id: true, guestName: true, user: { select: { name: true } } },
        })
      : [];
    const rooms = targetIds.length
      ? await prisma.prayerRoom.findMany({ where: { id: { in: targetIds } }, select: { id: true, name: true } })
      : [];
    const names = new Map<string, string>([
      ...participants.map((p) => [p.id, p.user?.name || p.guestName || 'A participant'] as [string, string]),
      ...rooms.map((r) => [r.id, r.name] as [string, string]),
    ]);
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      events: rows.map((r) => ({
        id: r.id,
        action: r.action,
        actorName: r.actor?.name || null,
        roomName: r.session?.prayerRoom?.name || null,
        targetName: r.targetId ? names.get(r.targetId) || null : null,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    sendError(res, error);
  }
}
