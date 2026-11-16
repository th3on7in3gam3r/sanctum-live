/** Links from PLCC Sanctum to the rest of the PLCC apps. Override with VITE_* env vars. */
const trim = (value: string) => value.replace(/\/+$/, '');

const env = import.meta.env as Record<string, string | undefined>;

export const PLCC_ONE_ORIGIN = trim(env.VITE_PLCC_ONE_URL || 'https://plcc-opal.vercel.app');
export const JORDAN_ORIGIN = trim(env.VITE_JORDAN_URL || 'https://plcc-chat.vercel.app');

export const PLCC_ONE_URL = `${PLCC_ONE_ORIGIN}/#/launcher`;

/** A Jordan room; a live one opens with its one-tap Join card. */
export function jordanRoomUrl(roomId: string, live: boolean) {
  return `${JORDAN_ORIGIN}/community/chat/${encodeURIComponent(roomId)}${live ? '?huddle=join' : ''}`;
}

export interface JordanRoom {
  id: string;
  name: string;
  live: boolean;
  /** People in the room now — only for signed-in staff, via Sanctum's server. */
  count?: number | null;
  capacity?: number | null;
}

/** Open (everyone) Jordan prayer rooms from PLCC Canaan. Empty when Canaan can't be reached. */
export async function fetchJordanRooms(signal?: AbortSignal): Promise<JordanRoom[]> {
  try {
    const response = await fetch(`${PLCC_ONE_ORIGIN}/api/vault?resource=live-prayer&rooms=1`, { signal });
    if (!response.ok) return [];
    const data = (await response.json()) as { rooms?: unknown };
    if (!Array.isArray(data.rooms)) return [];
    return data.rooms
      .filter((r): r is JordanRoom => Boolean(r && typeof r.id === 'string' && typeof r.name === 'string'))
      .map((r) => ({ id: r.id, name: r.name, live: r.live === true }));
  } catch {
    return [];
  }
}
