import { getPrisma } from '../server/prisma.ts';
import { ensureLiveKitRoom } from '../server/realtime/ensureLiveKitRoom.ts';
import { sessionRepository } from '../server/repositories/index.ts';

const prisma = getPrisma();
if (!prisma) throw new Error('DATABASE_URL is not configured');

const organization = await prisma.organization.upsert({
  where: { slug: 'promised-land-christian-center' },
  update: {
    name: 'Promised Land Christian Center',
    defaultSermonSpeaker: 'Pastor GraceLove Hiire',
  },
  create: {
    name: 'Promised Land Christian Center',
    slug: 'promised-land-christian-center',
    primaryContactName: 'Office',
    primaryContactEmail: 'office@example.org',
    defaultSermonSpeaker: 'Pastor GraceLove Hiire',
  },
});

const room = await prisma.prayerRoom.upsert({
  where: { organizationId_slug: { organizationId: organization.id, slug: 'promised-land-christian-center' } },
  update: {
    name: 'Promised Land Christian Center',
    allowGuests: true,
    passcodeHash: null,
  },
  create: {
    organizationId: organization.id,
    name: 'Promised Land Christian Center',
    slug: 'promised-land-christian-center',
    permanentUrl: '/join/promised-land-christian-center',
    allowGuests: true,
    isRecurring: true,
    recurrenceRule: 'DAILY',
    scheduledStart: '05:00 AM',
    timezone: 'Africa/Kampala',
  },
});

// The listener contrast check must be able to join at any time of day.
const session = await prisma.prayerSession.upsert({
  where: { id: 'sanctum-contrast-session' },
  create: {
    id: 'sanctum-contrast-session',
    prayerRoomId: room.id,
    status: 'WAITING',
    sermonLeaderName: 'Pastor GraceLove Hiire',
  },
  update: {
    status: 'WAITING',
    sermonLeaderName: 'Pastor GraceLove Hiire',
  },
});
await ensureLiveKitRoom(await sessionRepository.requireById(session.id));

console.log('Contrast room is ready');
await prisma.$disconnect();
