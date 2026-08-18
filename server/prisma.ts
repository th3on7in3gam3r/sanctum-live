import { PrismaClient } from '@prisma/client';
import { env, isDatabaseConfigured } from './env.ts';

let prismaClient: PrismaClient | null = null;

export function getPrisma(): PrismaClient | null {
  if (!isDatabaseConfigured()) return null;
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      datasources: { db: { url: env.databaseUrl! } },
    });
  }
  return prismaClient;
}

export async function pingDatabase(): Promise<'configured' | 'unavailable'> {
  const client = getPrisma();
  if (!client) return 'unavailable';
  try {
    await client.$queryRaw`SELECT 1`;
    return 'configured';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('database ping failed:', message);
    return 'unavailable';
  }
}
