import { Room } from 'livekit-client';
import type { Role, ConnectionQuality } from '../../types';
import type { IRealtimeProvider, RealtimeEventListener } from './types';

/**
 * Client LiveKit provider. Tokens are minted only by the Express API.
 * Never import livekit-server-sdk from this file.
 */
export class LiveKitRealtimeProvider implements IRealtimeProvider {
  readonly isDevelopment = false;
  private room: Room | null = null;
  private listeners = new Set<RealtimeEventListener>();

  async joinRoom(params: {
    roomSlug: string;
    displayName: string;
    role: Role;
    token?: string;
    livekitUrl?: string;
  }): Promise<{ sessionId: string; participantId: string; connectionQuality: ConnectionQuality }> {
    if (!params.token || !params.livekitUrl) {
      throw new Error('LiveKit connection unavailable in this environment.');
    }

    this.room = new Room();
    await this.room.connect(params.livekitUrl, params.token);

    return {
      sessionId: params.roomSlug,
      participantId: this.room.localParticipant.identity,
      connectionQuality: 'GOOD',
    };
  }

  async leaveRoom(_sessionId: string, _participantId: string): Promise<void> {
    await this.room?.disconnect();
    this.room = null;
  }

  async raiseHand(): Promise<void> {
    throw new Error('Use POST /api/sessions/:id/raise-hand');
  }
  async lowerHand(): Promise<void> {
    throw new Error('Use speaker floor API routes');
  }
  async sendReaction(): Promise<void> {
    throw new Error('Data messages require a connected LiveKit room');
  }
  async acceptSpeakerInvitation(): Promise<void> {
    throw new Error('Use POST /api/sessions/:id/speaker/grant');
  }
  async finishSpeaking(): Promise<void> {
    throw new Error('Use POST /api/sessions/:id/speaker/revoke');
  }
  async inviteSpeaker(): Promise<void> {
    throw new Error('Use POST /api/sessions/:id/speaker/invite');
  }
  async muteParticipant(): Promise<void> {
    throw new Error('Moderator mute is a server LiveKit operation');
  }
  async removeParticipant(): Promise<void> {
    throw new Error('Use POST /api/sessions/:id/participants/:id/remove');
  }
  async updateParticipantRole(): Promise<void> {
    throw new Error('Session roles are assigned by the server');
  }
  async endSession(): Promise<void> {
    throw new Error('Use POST /api/prayer-sessions/:id/end');
  }

  subscribe(callback: RealtimeEventListener): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export const livekitRealtimeProvider = new LiveKitRealtimeProvider();
