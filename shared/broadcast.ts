/** Moderator announcements in a Sanctum prayer room are stored as chat messages
 * whose sender name starts with this prefix. */
export const BROADCAST_PREFIX = '📣 ';
export const BROADCAST_MAX = 280;

export function isBroadcastName(displayName: string | null | undefined): boolean {
  return typeof displayName === 'string' && displayName.startsWith(BROADCAST_PREFIX);
}

export function broadcastSender(displayName: string): string {
  return displayName.slice(BROADCAST_PREFIX.length).trim() || 'Moderator';
}
