import { randomBytes } from 'node:crypto';

export type JoinConnectionKind = 'listener' | 'control';

export function createGuestRealtimeIdentity(): string {
  return `guest_${randomBytes(16).toString('hex')}`;
}

export function createMemberRealtimeIdentity(userId: string): string {
  return `user_${userId}`;
}

/** Separate LiveKit identity so Control Room and join page can both stay connected. */
export function createControlRealtimeIdentity(userId: string): string {
  return `user_${userId}_control`;
}

export function resolveJoinRealtimeIdentity(
  userId: string | null,
  _clientSuppliedIdentity?: string,
  connectionKind: JoinConnectionKind = 'listener'
): string {
  void _clientSuppliedIdentity;
  if (!userId) return createGuestRealtimeIdentity();
  if (connectionKind === 'control') return createControlRealtimeIdentity(userId);
  return createMemberRealtimeIdentity(userId);
}
