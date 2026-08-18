import { DatabaseUnavailable, DuplicateSlug, ParticipantNotFound, RoomNotFound, SessionNotFound } from '../../shared/errors.ts';
import { ensureSlugAvailable } from '../../shared/slug.ts';
import type { OrganizationRole, SessionRole } from '../../shared/roles.ts';
import type { SessionLifecycleState } from '../../shared/sessionStateMachine.ts';
import { getPrisma } from '../prisma.ts';

export interface PrayerRoomRecord {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  roomType: string;
  expectedAttendance: number;
  speakerPermission: string;
  isRecurring: boolean;
  recurrenceRule: string | null;
  scheduledStart: string;
  timezone: string;
  recordingEnabled: boolean;
  status: string;
  livekitRoomName: string | null;
  permanentUrl: string;
  createdById: string | null;
}

export interface PrayerSessionRecord {
  id: string;
  prayerRoomId: string;
  status: SessionLifecycleState;
  scheduledStart: Date | null;
  actualStart: Date | null;
  endedAt: Date | null;
  livekitRoomName: string | null;
  activeSpeakerParticipantId: string | null;
}

export interface SessionParticipantRecord {
  id: string;
  sessionId: string;
  userId: string | null;
  guestName: string | null;
  realtimeIdentity: string;
  role: SessionRole;
}

export interface MembershipRecord {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status: string;
}

function requirePrisma() {
  const prisma = getPrisma();
  if (!prisma) throw DatabaseUnavailable();
  return prisma;
}

export const prayerRoomRepository = {
  async findById(id: string): Promise<PrayerRoomRecord | null> {
    const prisma = requirePrisma();
    return prisma.prayerRoom.findUnique({ where: { id } });
  },

  async findByOrgAndSlug(organizationId: string, slug: string): Promise<PrayerRoomRecord | null> {
    const prisma = requirePrisma();
    return prisma.prayerRoom.findUnique({
      where: { organizationId_slug: { organizationId, slug } },
    });
  },

  async create(input: {
    organizationId: string;
    name: string;
    slug: string;
    description?: string;
    roomType?: string;
    expectedAttendance?: number;
    speakerPermission?: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
    scheduledStart?: string;
    timezone?: string;
    recordingEnabled?: boolean;
    createdById?: string;
    appUrl: string;
  }): Promise<PrayerRoomRecord> {
    const prisma = requirePrisma();
    const existing = await prisma.prayerRoom.findUnique({
      where: { organizationId_slug: { organizationId: input.organizationId, slug: input.slug } },
    });
    ensureSlugAvailable(Boolean(existing), input.slug);

    try {
      return await prisma.prayerRoom.create({
        data: {
          organizationId: input.organizationId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          roomType: (input.roomType as 'AUDIO_PRAYER') ?? 'AUDIO_PRAYER',
          expectedAttendance: input.expectedAttendance ?? 1000,
          speakerPermission: (input.speakerPermission as 'ADMIN_APPROVAL_REQUIRED') ?? 'ADMIN_APPROVAL_REQUIRED',
          isRecurring: input.isRecurring ?? false,
          recurrenceRule: input.recurrenceRule,
          scheduledStart: input.scheduledStart ?? '05:00 AM',
          timezone: input.timezone ?? 'Africa/Kampala',
          recordingEnabled: input.recordingEnabled ?? false,
          createdById: input.createdById,
          permanentUrl: `${input.appUrl}/join/${input.slug}`,
        },
      });
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : '';
      if (code === 'P2002') throw DuplicateSlug(input.slug);
      throw error;
    }
  },
};

export const membershipRepository = {
  async find(organizationId: string, userId: string): Promise<MembershipRecord | null> {
    const prisma = requirePrisma();
    return prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
  },
};

export const sessionRepository = {
  async findById(id: string): Promise<PrayerSessionRecord | null> {
    const prisma = requirePrisma();
    return prisma.prayerSession.findUnique({ where: { id } }) as Promise<PrayerSessionRecord | null>;
  },

  async requireById(id: string): Promise<PrayerSessionRecord> {
    const session = await this.findById(id);
    if (!session) throw SessionNotFound(id);
    return session;
  },

  async create(input: {
    prayerRoomId: string;
    status?: SessionLifecycleState;
    scheduledStart?: Date | null;
    livekitRoomName?: string;
  }): Promise<PrayerSessionRecord> {
    const prisma = requirePrisma();
    const room = await prisma.prayerRoom.findUnique({ where: { id: input.prayerRoomId } });
    if (!room) throw RoomNotFound(input.prayerRoomId);
    return prisma.prayerSession.create({
      data: {
        prayerRoomId: input.prayerRoomId,
        status: input.status ?? 'SCHEDULED',
        scheduledStart: input.scheduledStart ?? null,
        livekitRoomName: input.livekitRoomName,
      },
    }) as Promise<PrayerSessionRecord>;
  },

  async update(id: string, data: Partial<PrayerSessionRecord>): Promise<PrayerSessionRecord> {
    const prisma = requirePrisma();
    return prisma.prayerSession.update({
      where: { id },
      data: {
        status: data.status,
        scheduledStart: data.scheduledStart,
        actualStart: data.actualStart,
        endedAt: data.endedAt,
        livekitRoomName: data.livekitRoomName,
        activeSpeakerParticipantId: data.activeSpeakerParticipantId,
      },
    }) as Promise<PrayerSessionRecord>;
  },
};

export const participantRepository = {
  async findById(id: string): Promise<SessionParticipantRecord | null> {
    const prisma = requirePrisma();
    return prisma.sessionParticipant.findUnique({ where: { id } });
  },

  async requireById(id: string): Promise<SessionParticipantRecord> {
    const participant = await this.findById(id);
    if (!participant) throw ParticipantNotFound(id);
    return participant;
  },

  async findByRealtimeIdentity(sessionId: string, realtimeIdentity: string): Promise<SessionParticipantRecord | null> {
    const prisma = requirePrisma();
    return prisma.sessionParticipant.findUnique({
      where: { sessionId_realtimeIdentity: { sessionId, realtimeIdentity } },
    });
  },

  async create(input: {
    sessionId: string;
    userId?: string | null;
    guestName?: string | null;
    realtimeIdentity: string;
    role: SessionRole;
  }): Promise<SessionParticipantRecord> {
    const prisma = requirePrisma();
    return prisma.sessionParticipant.create({
      data: {
        sessionId: input.sessionId,
        userId: input.userId ?? null,
        guestName: input.guestName ?? null,
        realtimeIdentity: input.realtimeIdentity,
        role: input.role,
      },
    });
  },

  async updateRole(id: string, role: SessionRole): Promise<SessionParticipantRecord> {
    const prisma = requirePrisma();
    return prisma.sessionParticipant.update({ where: { id }, data: { role } });
  },

  async markLeft(id: string): Promise<void> {
    const prisma = requirePrisma();
    await prisma.sessionParticipant.update({ where: { id }, data: { leftAt: new Date() } });
  },
};

export const raisedHandRepository = {
  async create(sessionId: string, participantId: string) {
    const prisma = requirePrisma();
    return prisma.raisedHand.create({
      data: { sessionId, participantId, status: 'WAITING' },
    });
  },
};

export const speakerInvitationRepository = {
  async create(input: { sessionId: string; participantId: string; invitedById?: string | null }) {
    const prisma = requirePrisma();
    return prisma.speakerInvitation.create({
      data: {
        sessionId: input.sessionId,
        participantId: input.participantId,
        invitedById: input.invitedById ?? null,
        status: 'PENDING',
      },
    });
  },

  async updateStatus(id: string, status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'DECLINED' | 'EXPIRED') {
    const prisma = requirePrisma();
    return prisma.speakerInvitation.update({
      where: { id },
      data: {
        status,
        acceptedAt: status === 'ACCEPTED' ? new Date() : undefined,
        revokedAt: status === 'REVOKED' ? new Date() : undefined,
      },
    });
  },
};

export const auditRepository = {
  async write(input: {
    organizationId?: string | null;
    sessionId?: string | null;
    actorId?: string | null;
    action:
      | 'ROOM_CREATED'
      | 'ROOM_UPDATED'
      | 'ROOM_ARCHIVED'
      | 'SESSION_STARTED'
      | 'SESSION_ENDED'
      | 'SESSION_CANCELLED'
      | 'PARTICIPANT_JOINED'
      | 'PARTICIPANT_REMOVED'
      | 'HAND_RAISED'
      | 'SPEAKER_INVITED'
      | 'SPEAKER_GRANTED'
      | 'SPEAKER_REVOKED'
      | 'SPEAKER_TRANSFERRED'
      | 'ROLE_CHANGED';
    targetId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const prisma = requirePrisma();
    return prisma.auditEvent.create({
      data: {
        organizationId: input.organizationId ?? null,
        sessionId: input.sessionId ?? null,
        actorId: input.actorId ?? null,
        action: input.action,
        targetId: input.targetId ?? null,
        metadata: (input.metadata ?? undefined) as object | undefined,
      },
    });
  },
};
