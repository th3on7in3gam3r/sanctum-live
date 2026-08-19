import { PrismaClient } from '@prisma/client';
import { SEED_MEMBERSHIPS, SEED_ORG_ID } from './seedMemberships.ts';

const prisma = new PrismaClient();
const ORG_ID = SEED_ORG_ID;

async function main() {
  await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: { name: 'Miracle Center Kampala', slug: 'miracle-center-kampala' },
    create: {
      id: ORG_ID,
      name: 'Miracle Center Kampala',
      slug: 'miracle-center-kampala',
      country: 'Uganda',
      timezone: 'Africa/Kampala',
      website: 'https://miraclecenter.org',
      primaryContactName: 'Pastor Kenneth',
      primaryContactEmail: 'kenneth@miraclecenter.org',
      phone: '+256 772 100 200',
      joinPageMessage: 'Welcome to Miracle Center Kampala Live Prayer. Join your church family lifting one voice.',
    },
  });

  for (const user of SEED_MEMBERSHIPS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { name: user.name, email: user.email },
      create: { id: user.id, name: user.name, email: user.email },
    });
    await prisma.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId: ORG_ID, userId: user.id } },
      update: { role: user.role, status: 'ACTIVE' },
      create: {
        organizationId: ORG_ID,
        userId: user.id,
        role: user.role,
        status: 'ACTIVE',
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
