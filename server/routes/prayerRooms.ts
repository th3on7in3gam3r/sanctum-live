import type { Request, Response } from 'express';
import { requireCanCreateRoom, requireCanDeleteRoom } from '../authz.ts';
import { resolveActorFromRequest } from '../clerkAuth.ts';
import { env, isLiveKitConfigured } from '../env.ts';
import { sendError } from '../http.ts';
import { RoomNotFound, Unauthorized } from '../../shared/errors.ts';
import { auditRepository, prayerRoomRepository, sessionRepository } from '../repositories/index.ts';
import { ensureLiveKitRoom } from '../realtime/ensureLiveKitRoom.ts';
import { getLiveKitProvider } from '../realtime/livekitProvider.ts';

function parseOptionalLogoUrl(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw !== 'string') {
    throw Unauthorized('Logo must be a public http or https image URL.');
  }
  const logoUrl = raw.trim();
  if (!logoUrl) return null;
  let parsed: URL;
  try {
    parsed = new URL(logoUrl);
  } catch {
    throw Unauthorized('Logo must be a public http or https image URL.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw Unauthorized('Logo must be a public http or https image URL.');
  }
  return logoUrl;
}

export async function listPrayerRoomsHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = await resolveActorFromRequest(req);
    if (!actor.organizationId || !actor.orgRole) {
      throw Unauthorized();
    }

    const rooms = await prayerRoomRepository.listByOrganization(actor.organizationId);
    res.json({ rooms });
  } catch (error) {
    sendError(res, error);
  }
}

export async function createPrayerRoomHandler(req: Request, res: Response): Promise<void> {
  try {
    const requestedOrg = typeof req.body?.organizationId === 'string' ? req.body.organizationId : null;
    const actor = await resolveActorFromRequest(req, requestedOrg);
    requireCanCreateRoom(actor);

    const orgId = actor.organizationId;
    if (!orgId) {
      throw RoomNotFound();
    }
    if (!String(req.body?.name || '').trim() || !String(req.body?.slug || '').trim()) {
      throw Unauthorized('Room name and slug are required');
    }

    const logoUrl = parseOptionalLogoUrl(req.body?.logoUrl);

    const room = await prayerRoomRepository.create({
      organizationId: orgId,
      name: String(req.body?.name || ''),
      slug: String(req.body?.slug || ''),
      description: req.body?.description,
      logoUrl: logoUrl ?? null,
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

    const session = await sessionRepository.create({
      prayerRoomId: room.id,
      status: 'WAITING',
    });
    try {
      await ensureLiveKitRoom(session);
    } catch {
      /* Join still works once LiveKit is configured; the sanctuary is already WAITING. */
    }

    res.status(201).json({ room });
  } catch (error) {
    sendError(res, error);
  }
}

export async function updatePrayerRoomHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = await resolveActorFromRequest(req);
    requireCanCreateRoom(actor);

    const orgId = actor.organizationId;
    if (!orgId) {
      throw RoomNotFound();
    }

    const logoUrl = parseOptionalLogoUrl(req.body?.logoUrl);

    const room = await prayerRoomRepository.update(req.params.roomId, orgId, {
      ...(typeof req.body?.name === 'string' ? { name: req.body.name.trim() } : {}),
      ...(typeof req.body?.slug === 'string' ? { slug: req.body.slug.trim(), appUrl: env.appUrl } : {}),
      ...(typeof req.body?.description === 'string' ? { description: req.body.description.trim() || null } : {}),
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      ...(typeof req.body?.roomType === 'string' ? { roomType: req.body.roomType } : {}),
      ...(typeof req.body?.expectedAttendance === 'number'
        ? { expectedAttendance: req.body.expectedAttendance }
        : {}),
      ...(typeof req.body?.speakerPermission === 'string'
        ? { speakerPermission: req.body.speakerPermission }
        : {}),
      ...(typeof req.body?.isRecurring === 'boolean' ? { isRecurring: req.body.isRecurring } : {}),
      ...(typeof req.body?.recurrenceRule === 'string' || req.body?.recurrenceRule === null
        ? { recurrenceRule: req.body.recurrenceRule }
        : {}),
      ...(typeof req.body?.scheduledStart === 'string' ? { scheduledStart: req.body.scheduledStart } : {}),
      ...(typeof req.body?.timezone === 'string' ? { timezone: req.body.timezone } : {}),
      ...(typeof req.body?.recordingEnabled === 'boolean'
        ? { recordingEnabled: req.body.recordingEnabled }
        : {}),
    });

    await auditRepository.write({
      organizationId: orgId,
      actorId: actor.userId,
      action: 'ROOM_UPDATED',
      targetId: room.id,
    });

    res.json({ room });
  } catch (error) {
    sendError(res, error);
  }
}

export async function deletePrayerRoomHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = await resolveActorFromRequest(req);
    requireCanDeleteRoom(actor);

    const orgId = actor.organizationId;
    if (!orgId) {
      throw RoomNotFound();
    }

    const deleted = await prayerRoomRepository.deleteById(req.params.roomId, orgId);

    await auditRepository.write({
      organizationId: orgId,
      actorId: actor.userId,
      action: 'ROOM_ARCHIVED',
      targetId: req.params.roomId,
    });

    if (isLiveKitConfigured()) {
      for (const roomName of deleted.livekitRoomNames) {
        void getLiveKitProvider().deleteRoom(roomName);
      }
    }

    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
}
