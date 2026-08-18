/**
 * Prototype shell persistence adapter (Phase 1A / 1B.1).
 * localStorage is labeled and isolated here so UI pages do not write domain
 * state directly. Durable source of truth moves to Postgres via server/.
 */
import type { PrayerRequest, PrayerRoom, PrayerSession } from '../../types';

const KEYS = {
  rooms: 'sanctum_rooms',
  history: 'sanctum_history',
  requests: 'sanctum_requests',
  dataSaver: 'sanctum_data_saver',
  theme: 'sanctum_theme',
  org: 'sanctum_org',
  user: 'sanctum_user',
} as const;

export const PROTOTYPE_SHELL_PERSISTENCE = 'localStorage (prototype adapter until database is connected)';

function readJson<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* prototype adapter: storage may be unavailable */
  }
}

export const localPersistenceAdapter = {
  label: PROTOTYPE_SHELL_PERSISTENCE,
  loadRooms: (fallback: PrayerRoom[]) => readJson<PrayerRoom[]>(KEYS.rooms, fallback),
  saveRooms: (rooms: PrayerRoom[]) => writeJson(KEYS.rooms, rooms),
  loadHistory: (fallback: PrayerSession[]) => readJson<PrayerSession[]>(KEYS.history, fallback),
  saveHistory: (sessions: PrayerSession[]) => writeJson(KEYS.history, sessions),
  loadRequests: (fallback: PrayerRequest[]) => readJson<PrayerRequest[]>(KEYS.requests, fallback),
  saveRequests: (requests: PrayerRequest[]) => writeJson(KEYS.requests, requests),
  loadDataSaver: (fallback: string) => {
    try {
      return localStorage.getItem(KEYS.dataSaver) || fallback;
    } catch {
      return fallback;
    }
  },
  saveDataSaver: (mode: string) => {
    try {
      localStorage.setItem(KEYS.dataSaver, mode);
    } catch {}
  },
  loadTheme: () => {
    try {
      return localStorage.getItem(KEYS.theme) === 'dark';
    } catch {
      return false;
    }
  },
  saveTheme: (isDark: boolean) => {
    try {
      localStorage.setItem(KEYS.theme, isDark ? 'dark' : 'light');
    } catch {}
  },
};
