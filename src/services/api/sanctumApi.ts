export type RealtimeEngineStatus = 'configured' | 'not_configured' | 'unreachable';

export interface ApiHealth {
  ok: boolean;
  database: 'configured' | 'unavailable';
  livekit: 'configured' | 'unavailable';
  realtimeEngine: 'configured' | 'not_configured';
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiClientError(
      typeof body.error === 'string' ? body.error : 'REQUEST_FAILED',
      typeof body.message === 'string' ? body.message : 'Request failed',
      response.status
    );
  }
  return body as T;
}

export async function fetchHealth(): Promise<ApiHealth | null> {
  try {
    return await apiFetch<ApiHealth>('/api/health');
  } catch {
    return null;
  }
}

export function healthToEngineStatus(health: ApiHealth | null): RealtimeEngineStatus {
  if (!health) return 'unreachable';
  return health.livekit === 'configured' ? 'configured' : 'not_configured';
}

export const sanctumApi = {
  fetchHealth,
  createPrayerRoom: (input: Record<string, unknown>, actor: { userId?: string; organizationId?: string }) =>
    apiFetch<{ room: Record<string, unknown> }>('/api/prayer-rooms', {
      method: 'POST',
      headers: {
        ...(actor.userId ? { 'x-user-id': actor.userId } : {}),
        ...(actor.organizationId ? { 'x-organization-id': actor.organizationId } : {}),
      },
      body: JSON.stringify(input),
    }),
  createPrayerSession: (input: Record<string, unknown>, actor: { userId?: string; organizationId?: string }) =>
    apiFetch<{ session: Record<string, unknown> }>('/api/prayer-sessions', {
      method: 'POST',
      headers: {
        ...(actor.userId ? { 'x-user-id': actor.userId } : {}),
        ...(actor.organizationId ? { 'x-organization-id': actor.organizationId } : {}),
      },
      body: JSON.stringify(input),
    }),
  startPrayerSession: (sessionId: string, actor: { userId?: string; organizationId?: string }) =>
    apiFetch(`/api/prayer-sessions/${sessionId}/start`, {
      method: 'POST',
      headers: {
        ...(actor.userId ? { 'x-user-id': actor.userId } : {}),
        ...(actor.organizationId ? { 'x-organization-id': actor.organizationId } : {}),
      },
      body: JSON.stringify({}),
    }),
  endPrayerSession: (sessionId: string, actor: { userId?: string; organizationId?: string }) =>
    apiFetch(`/api/prayer-sessions/${sessionId}/end`, {
      method: 'POST',
      headers: {
        ...(actor.userId ? { 'x-user-id': actor.userId } : {}),
        ...(actor.organizationId ? { 'x-organization-id': actor.organizationId } : {}),
      },
      body: JSON.stringify({}),
    }),
  joinSession: (sessionId: string, input: { guestName?: string; userId?: string; role?: string }) =>
    apiFetch<{
      participant: {
        id: string;
        realtimeIdentity: string;
        role: string;
        guestName: string | null;
      };
      token: string | null;
      livekitUrl: string | null;
      realtimeConfigured: boolean;
    }>(`/api/sessions/${sessionId}/join`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  raiseHand: (sessionId: string, participantId: string) =>
    apiFetch(`/api/sessions/${sessionId}/raise-hand`, {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    }),
  inviteSpeaker: (sessionId: string, participantId: string, actor: { userId?: string; organizationId?: string }) =>
    apiFetch(`/api/sessions/${sessionId}/speaker/invite`, {
      method: 'POST',
      headers: {
        ...(actor.userId ? { 'x-user-id': actor.userId } : {}),
        ...(actor.organizationId ? { 'x-organization-id': actor.organizationId } : {}),
      },
      body: JSON.stringify({ participantId }),
    }),
  grantSpeaker: (sessionId: string, participantId: string, actor: { userId?: string; organizationId?: string }) =>
    apiFetch(`/api/sessions/${sessionId}/speaker/grant`, {
      method: 'POST',
      headers: {
        ...(actor.userId ? { 'x-user-id': actor.userId } : {}),
        ...(actor.organizationId ? { 'x-organization-id': actor.organizationId } : {}),
      },
      body: JSON.stringify({ participantId }),
    }),
  revokeSpeaker: (sessionId: string, participantId: string, actor: { userId?: string; organizationId?: string }) =>
    apiFetch(`/api/sessions/${sessionId}/speaker/revoke`, {
      method: 'POST',
      headers: {
        ...(actor.userId ? { 'x-user-id': actor.userId } : {}),
        ...(actor.organizationId ? { 'x-organization-id': actor.organizationId } : {}),
      },
      body: JSON.stringify({ participantId }),
    }),
  transferSpeaker: (sessionId: string, participantId: string, actor: { userId?: string; organizationId?: string }) =>
    apiFetch(`/api/sessions/${sessionId}/speaker/transfer`, {
      method: 'POST',
      headers: {
        ...(actor.userId ? { 'x-user-id': actor.userId } : {}),
        ...(actor.organizationId ? { 'x-organization-id': actor.organizationId } : {}),
      },
      body: JSON.stringify({ participantId }),
    }),
  removeParticipant: (sessionId: string, participantId: string, actor: { userId?: string; organizationId?: string }) =>
    apiFetch(`/api/sessions/${sessionId}/participants/${participantId}/remove`, {
      method: 'POST',
      headers: {
        ...(actor.userId ? { 'x-user-id': actor.userId } : {}),
        ...(actor.organizationId ? { 'x-organization-id': actor.organizationId } : {}),
      },
      body: JSON.stringify({}),
    }),
};
