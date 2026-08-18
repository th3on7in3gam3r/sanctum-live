import { randomBytes } from 'node:crypto';

export function createGuestRealtimeIdentity(): string {
  return `guest_${randomBytes(16).toString('hex')}`;
}

export function createMemberRealtimeIdentity(userId: string): string {
  return `user_${userId}`;
}

export function resolveJoinRealtimeIdentity(userId: string | null, _clientSuppliedIdentity?: string): string {
  void _clientSuppliedIdentity;
  return userId ? createMemberRealtimeIdentity(userId) : createGuestRealtimeIdentity();
}
