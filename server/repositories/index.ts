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
  peakConcurrentParticipants: number;
}

export interface SessionParticipantRecord {
  id: string;
  sessionId: string;
  userId: string | null;
  guestName: string | null;
  realtimeIdentity: string;
  role: SessionRole;
  baseRole: SessionRole;
  leftAt: Date | null;
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

  async findBySlug(slug: string): Promise<PrayerRoomRecord | null> {
    const prisma = requirePrisma();
    return prisma.prayerRoom.findFirst({ where: { slug }, orderBy: { createdAt: 'asc' } });
  },

  async findPublicAltarBySlug(slug: string) {
    const prisma = requirePrisma();
    return prisma.prayerRoom.findFirst({
      where: { slug },
      include: { organization: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findByOrgAndSlug(organizationId: string, slug: string): Promise<PrayerRoomRecord | null> {
    const prisma = requirePrisma();
    return prisma.prayerRoom.findUnique({
      where: { organizationId_slug: { organizationId, slug } },
    });
  },

  async listByOrganization(organizationId: string): Promise<PrayerRoomRecord[]> {
    const prisma = requirePrisma();
    return prisma.prayerRoom.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
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

export interface UserRecord {
  id: string;
  clerkUserId: string | null;
  name: string;
  email: string;
}

export const userRepository = {
  async findById(id: string): Promise<UserRecord | null> {
    const prisma = requirePrisma();
    return prisma.user.findUnique({ where: { id } });
  },
  async findByEmail(email: string): Promise<UserRecord | null> {
    const prisma = requirePrisma();
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
  },
  async findByClerkUserId(clerkUserId: string): Promise<UserRecord | null> {
    const prisma = requirePrisma();
    return prisma.user.findUnique({ where: { clerkUserId } });
  },
  async setClerkUserId(id: string, clerkUserId: string): Promise<void> {
    const prisma = requirePrisma();
    await prisma.user.update({ where: { id }, data: { clerkUserId } });
  },
  async create(input: { name: string; email: string; clerkUserId?: string }): Promise<UserRecord> {
    const prisma = requirePrisma();
    return prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        clerkUserId: input.clerkUserId,
      },
    });
  },
};

export const organizationRepository = {
  async findById(id: string) {
    const prisma = requirePrisma();
    return prisma.organization.findUnique({ where: { id } });
  },
  async findBySlug(slug: string) {
    const prisma = requirePrisma();
    return prisma.organization.findUnique({ where: { slug } });
  },
  async create(input: {
    name: string;
    slug: string;
    primaryContactName: string;
    primaryContactEmail: string;
    logoUrl?: string | null;
  }) {
    const prisma = requirePrisma();
    return prisma.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        primaryContactName: input.primaryContactName,
        primaryContactEmail: input.primaryContactEmail,
        logoUrl: input.logoUrl || null,
        joinPageMessage: 'Join your church family in prayer.',
      },
    });
  },
  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      logoUrl?: string | null;
      country?: string;
      timezone?: string;
      website?: string | null;
      joinPageMessage?: string | null;
      accentColor?: string | null;
    }
  ) {
    const prisma = requirePrisma();
    return prisma.organization.update({ where: { id }, data });
  },
  async deleteById(organizationId: string): Promise<void> {
    const prisma = requirePrisma();
    const rooms = await prisma.prayerRoom.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const roomIds = rooms.map((row) => row.id);
    const sessions = roomIds.length
      ? await prisma.prayerSession.findMany({
          where: { prayerRoomId: { in: roomIds } },
          select: { id: true },
        })
      : [];
    const sessionIds = sessions.map((row) => row.id);

    await prisma.$transaction(async (tx) => {
      if (sessionIds.length) {
        await tx.prayerSession.updateMany({
          where: { id: { in: sessionIds } },
          data: { activeSpeakerParticipantId: null },
        });
        await tx.prayerSession.deleteMany({ where: { id: { in: sessionIds } } });
      }
      if (roomIds.length) {
        await tx.prayerRoom.deleteMany({ where: { id: { in: roomIds } } });
      }
      await tx.organization.delete({ where: { id: organizationId } });
    });
  },
};

export const membershipRepository = {
  async find(organizationId: string, userId: string): Promise<MembershipRecord | null> {
    const prisma = requirePrisma();
    return prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
  },
  async listActiveByUser(userId: string): Promise<MembershipRecord[]> {
    const prisma = requirePrisma();
    return prisma.organizationMembership.findMany({
      where: { userId, status: 'ACTIVE' },
    });
  },
  async listByOrganization(organizationId: string): Promise<
    Array<MembershipRecord & { user: { id: string; name: string; email: string } }>
  > {
    const prisma = requirePrisma();
    return prisma.organizationMembership.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  },
  async upsertInvite(input: {
    organizationId: string;
    userId: string;
    role: OrganizationRole;
  }): Promise<MembershipRecord> {
    const prisma = requirePrisma();
    return prisma.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId: input.organizationId, userId: input.userId } },
      create: {
        organizationId: input.organizationId,
        userId: input.userId,
        role: input.role,
        status: 'INVITED',
      },
      update: {
        role: input.role,
        status: 'INVITED',
      },
    });
  },
  async activateInvitedForUser(userId: string): Promise<void> {
    const prisma = requirePrisma();
    await prisma.organizationMembership.updateMany({
      where: { userId, status: 'INVITED' },
      data: { status: 'ACTIVE' },
    });
  },
  async ensureActiveOwner(organizationId: string, userId: string): Promise<MembershipRecord> {
    const prisma = requirePrisma();
    return prisma.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId, userId } },
      create: {
        organizationId,
        userId,
        role: 'OWNER',
        status: 'ACTIVE',
      },
      update: {
        role: 'OWNER',
        status: 'ACTIVE',
      },
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
        peakConcurrentParticipants: data.peakConcurrentParticipants,
      },
    }) as Promise<PrayerSessionRecord>;
  },

  async findJoinableByRoom(prayerRoomId: string): Promise<PrayerSessionRecord | null> {
    const prisma = requirePrisma();
    return prisma.prayerSession.findFirst({
      where: { prayerRoomId, status: { in: ['WAITING', 'STARTING', 'LIVE'] } },
      orderBy: { createdAt: 'desc' },
    }) as Promise<PrayerSessionRecord | null>;
  },

  async findOpenableByRoom(prayerRoomId: string): Promise<PrayerSessionRecord | null> {
    const prisma = requirePrisma();
    return prisma.prayerSession.findFirst({
      where: { prayerRoomId, status: { in: ['SCHEDULED', 'WAITING'] } },
      orderBy: { createdAt: 'desc' },
    }) as Promise<PrayerSessionRecord | null>;
  },

  async findByLiveKitRoomName(livekitRoomName: string): Promise<PrayerSessionRecord | null> {
    const prisma = requirePrisma();
    return prisma.prayerSession.findFirst({
      where: { livekitRoomName },
      orderBy: { createdAt: 'desc' },
    }) as Promise<PrayerSessionRecord | null>;
  },

  async bumpPeakConcurrent(id: string, connectedNow: number): Promise<void> {
    const prisma = requirePrisma();
    const session = await prisma.prayerSession.findUnique({ where: { id } });
    if (!session) return;
    if (connectedNow > session.peakConcurrentParticipants) {
      await prisma.prayerSession.update({
        where: { id },
        data: { peakConcurrentParticipants: connectedNow },
      });
    }
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
    baseRole?: SessionRole;
  }): Promise<SessionParticipantRecord> {
    const prisma = requirePrisma();
    return prisma.sessionParticipant.create({
      data: {
        sessionId: input.sessionId,
        userId: input.userId ?? null,
        guestName: input.guestName ?? null,
        realtimeIdentity: input.realtimeIdentity,
        role: input.role,
        baseRole: input.baseRole ?? input.role,
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

  async markRejoined(id: string): Promise<SessionParticipantRecord> {
    const prisma = requirePrisma();
    return prisma.sessionParticipant.update({ where: { id }, data: { leftAt: null } });
  },

  async listBySession(sessionId: string) {
    const prisma = requirePrisma();
    return prisma.sessionParticipant.findMany({
      where: { sessionId },
      orderBy: { joinedAt: 'asc' },
    });
  },
};

export const raisedHandRepository = {
  async create(sessionId: string, participantId: string) {
    const prisma = requirePrisma();
    return prisma.raisedHand.create({
      data: { sessionId, participantId, status: 'WAITING' },
    });
  },

  async upsertWaiting(sessionId: string, participantId: string) {
    const prisma = requirePrisma();
    const existing = await prisma.raisedHand.findFirst({
      where: { sessionId, participantId, status: { in: ['WAITING', 'INVITED'] } },
      orderBy: { raisedAt: 'desc' },
    });
    if (existing) return existing;
    return prisma.raisedHand.create({
      data: { sessionId, participantId, status: 'WAITING' },
    });
  },

  async findById(id: string) {
    const prisma = requirePrisma();
    return prisma.raisedHand.findUnique({ where: { id } });
  },

  async findOpenForParticipant(sessionId: string, participantId: string) {
    const prisma = requirePrisma();
    return prisma.raisedHand.findFirst({
      where: { sessionId, participantId, status: { in: ['WAITING', 'INVITED'] } },
      orderBy: { raisedAt: 'desc' },
    });
  },

  async updateStatus(id: string, status: 'WAITING' | 'INVITED' | 'DISMISSED' | 'RESOLVED') {
    const prisma = requirePrisma();
    return prisma.raisedHand.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'DISMISSED' || status === 'RESOLVED' ? new Date() : null,
      },
    });
  },

  async listWaiting(sessionId: string) {
    const prisma = requirePrisma();
    return prisma.raisedHand.findMany({
      where: { sessionId, status: { in: ['WAITING', 'INVITED'] } },
      orderBy: { raisedAt: 'asc' },
      include: { participant: true },
    });
  },
};

export const speakerInvitationRepository = {
  async create(input: { sessionId: string; participantId: string; invitedById?: string | null }) {
    const prisma = requirePrisma();
    const existing = await prisma.speakerInvitation.findFirst({
      where: { sessionId: input.sessionId, participantId: input.participantId, status: 'PENDING' },
    });
    if (existing) return existing;
    return prisma.speakerInvitation.create({
      data: {
        sessionId: input.sessionId,
        participantId: input.participantId,
        invitedById: input.invitedById ?? null,
        status: 'PENDING',
      },
    });
  },

  async findById(id: string) {
    const prisma = requirePrisma();
    return prisma.speakerInvitation.findUnique({ where: { id } });
  },

  async findPendingForParticipant(sessionId: string, participantId: string) {
    const prisma = requirePrisma();
    return prisma.speakerInvitation.findFirst({
      where: { sessionId, participantId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  },

  async listPending(sessionId: string) {
    const prisma = requirePrisma();
    return prisma.speakerInvitation.findMany({
      where: { sessionId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
  },

  async updateStatus(id: string, status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'DECLINED' | 'EXPIRED') {
    const prisma = requirePrisma();
    return prisma.speakerInvitation.update({
      where: { id },
      data: {
        status,
        acceptedAt: status === 'ACCEPTED' ? new Date() : undefined,
        revokedAt: status === 'REVOKED' || status === 'DECLINED' || status === 'EXPIRED' ? new Date() : undefined,
      },
    });
  },
};

export const webhookEventRepository = {
  async recordIfNew(eventId: string, eventType: string, roomName: string | null, payload: unknown): Promise<boolean> {
    const prisma = requirePrisma();
    try {
      await prisma.webhookEvent.create({
        data: {
          eventId,
          eventType,
          roomName,
          payload: payload as object,
        },
      });
      return true;
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : '';
      if (code === 'P2002') return false;
      throw error;
    }
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
