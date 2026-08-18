import { config as loadDotenv } from 'dotenv';

loadDotenv();

export type ServiceStatus = 'configured' | 'unavailable';

export interface ServerEnv {
  nodeEnv: string;
  port: number;
  bindHost: string;
  appUrl: string;
  databaseUrl: string | null;
  livekitUrl: string | null;
  livekitApiKey: string | null;
  livekitApiSecret: string | null;
}

function readOptional(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function parsePort(): number {
  const raw = process.env.API_PORT || process.env.PORT || '3001';
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3001;
}

export const env: ServerEnv = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePort(),
  bindHost: '0.0.0.0',
  appUrl: readOptional('APP_URL') || 'http://localhost:3000',
  databaseUrl: readOptional('DATABASE_URL_POOLED') || readOptional('DATABASE_URL'),
  livekitUrl: readOptional('LIVEKIT_URL'),
  livekitApiKey: readOptional('LIVEKIT_API_KEY'),
  livekitApiSecret: readOptional('LIVEKIT_API_SECRET'),
};

export function getDatabaseStatus(): ServiceStatus {
  return env.databaseUrl ? 'configured' : 'unavailable';
}

export function getLiveKitStatus(): ServiceStatus {
  return env.livekitUrl && env.livekitApiKey && env.livekitApiSecret ? 'configured' : 'unavailable';
}

export function isLiveKitConfigured(): boolean {
  return getLiveKitStatus() === 'configured';
}

export function isDatabaseConfigured(): boolean {
  return getDatabaseStatus() === 'configured';
}
