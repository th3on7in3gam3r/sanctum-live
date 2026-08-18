import type { Request, Response } from 'express';
import { RoomNotFound, Unauthorized } from '../../shared/errors.ts';
import { env } from '../env.ts';
import { sendError } from '../http.ts';
import { auditRepository, prayerRoomRepository } from '../repositories/index.ts';
import { readActorHeaders, requireCanCreateRoom, resolveActor } from '../authz.ts';

export async function createPrayerRoomHandler(req: Request, res: Response): Promise<void> {
  try {
    const { userId, organizationId } = readActorHeaders(req.headers as Record<string, unknown>);
    const orgId = typeof req.body?.organizationId === 'string' ? req.body.organizationId : organizationId;
    const actor = await resolveActor(orgId, userId);
    requireCanCreateRoom(actor);

    if (!orgId) {
      throw RoomNotFound();
    }
    if (!String(req.body?.name || '').trim() || !String(req.body?.slug || '').trim()) {
      throw Unauthorized('Room name and slug are required');
    }

    const room = await prayerRoomRepository.create({
      organizationId: orgId,
      name: String(req.body?.name || ''),
      slug: String(req.body?.slug || ''),
      description: req.body?.description,
      roomType: req.body?.roomType,
      expectedAttendance: req.body?.expectedAttendance,
      speakerPermission: req.body?.speakerPermission,
      isRecurring: req.body?.isRecurring,
      recurrenceRule: req.body?.recurrenceRule,
      scheduledStart: req.body?.scheduledStart,
      timezone: req.body?.timezone,
      recordingEnabled: req.body?.recordingEnabled,
      createdById: actor.userId ?? undefined,
      appUrl: env.appUrl,
    });

    await auditRepository.write({
      organizationId: orgId,
      actorId: actor.userId,
      action: 'ROOM_CREATED',
      targetId: room.id,
    });

    res.status(201).json({ room });
  } catch (error) {
    sendError(res, error);
  }
}
