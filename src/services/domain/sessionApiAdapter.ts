import { ApiClientError, sanctumApi } from '../api/sanctumApi';

const UNCONFIGURED = 'LiveKit connection unavailable in this environment.';

function isServerSessionId(sessionId: string | undefined): sessionId is string {
  return Boolean(sessionId && !sessionId.startsWith('session_'));
}

async function callOrUnavailable(run: () => Promise<unknown>): Promise<{ ok: boolean; reason?: string }> {
  try {
    await run();
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { ok: false, reason: error.message };
    }
    return { ok: false, reason: UNCONFIGURED };
  }
}

export const sessionApiAdapter = {
  async join(sessionId: string | undefined, guestName: string, userId?: string) {
    if (!isServerSessionId(sessionId)) {
      return { ok: false as const, reason: UNCONFIGURED, participant: null };
    }
    try {
      const result = await sanctumApi.joinSession(sessionId, { guestName, userId });
      return { ok: true as const, reason: undefined, participant: result.participant, token: result.token, realtimeConfigured: result.realtimeConfigured };
    } catch (error) {
      const reason = error instanceof ApiClientError ? error.message : UNCONFIGURED;
      return { ok: false as const, reason, participant: null };
    }
  },

  async raiseHand(sessionId: string | undefined, participantId: string) {
    if (!isServerSessionId(sessionId)) return { ok: false, reason: UNCONFIGURED };
    return callOrUnavailable(() => sanctumApi.raiseHand(sessionId, participantId));
  },

  async inviteSpeaker(sessionId: string | undefined, participantId: string, actor: { userId?: string; organizationId?: string }) {
    if (!isServerSessionId(sessionId)) return { ok: false, reason: UNCONFIGURED };
    return callOrUnavailable(() => sanctumApi.inviteSpeaker(sessionId, participantId, actor));
  },

  async grantSpeaker(sessionId: string | undefined, participantId: string, actor: { userId?: string; organizationId?: string }) {
    if (!isServerSessionId(sessionId)) return { ok: false, reason: UNCONFIGURED };
    return callOrUnavailable(() => sanctumApi.grantSpeaker(sessionId, participantId, actor));
  },

  async revokeSpeaker(sessionId: string | undefined, participantId: string, actor: { userId?: string; organizationId?: string }) {
    if (!isServerSessionId(sessionId)) return { ok: false, reason: UNCONFIGURED };
    return callOrUnavailable(() => sanctumApi.revokeSpeaker(sessionId, participantId, actor));
  },

  async removeParticipant(sessionId: string | undefined, participantId: string, actor: { userId?: string; organizationId?: string }) {
    if (!isServerSessionId(sessionId)) return { ok: false, reason: UNCONFIGURED };
    return callOrUnavailable(() => sanctumApi.removeParticipant(sessionId, participantId, actor));
  },

  async endSession(sessionId: string | undefined, actor: { userId?: string; organizationId?: string }) {
    if (!isServerSessionId(sessionId)) return { ok: false, reason: UNCONFIGURED };
    return callOrUnavailable(() => sanctumApi.endPrayerSession(sessionId, actor));
  },
};
