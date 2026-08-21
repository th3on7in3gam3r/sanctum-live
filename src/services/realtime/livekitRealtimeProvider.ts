import {
  ConnectionState as LiveKitConnectionState,
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
} from 'livekit-client';
import type { ConnectionQuality, ConnectionState, Role } from '../../types';
import type { IRealtimeProvider, RealtimeEventListener, RealtimeEventPayload } from './types';

export interface LiveKitJoinParams {
  roomSlug: string;
  displayName: string;
  role: Role;
  token?: string;
  livekitUrl?: string;
}

function mapConnectionState(state: LiveKitConnectionState): ConnectionState {
  switch (state) {
    case LiveKitConnectionState.Connecting:
      return 'CONNECTING';
    case LiveKitConnectionState.Connected:
      return 'CONNECTED';
    case LiveKitConnectionState.Reconnecting:
    case LiveKitConnectionState.SignalReconnecting:
      return 'RECONNECTING';
    case LiveKitConnectionState.Disconnected:
      return 'DISCONNECTED';
    default:
      return 'FAILED';
  }
}

/**
 * Client LiveKit provider. Tokens are minted only by the Express API.
 * Never import livekit-server-sdk from this file. Audio-only.
 */
export class LiveKitRealtimeProvider implements IRealtimeProvider {
  readonly isDevelopment = false;
  private room: Room | null = null;
  private listeners = new Set<RealtimeEventListener>();
  private audioElements = new Map<string, HTMLAudioElement>();
  private sessionId = '';
  connectionState: ConnectionState = 'DISCONNECTED';
  audioBlocked = false;
  connectedCount = 0;

  async joinRoom(params: LiveKitJoinParams): Promise<{
    sessionId: string;
    participantId: string;
    connectionQuality: ConnectionQuality;
  }> {
    if (!params.token || !params.livekitUrl) {
      throw new Error('LiveKit connection unavailable in this environment.');
    }

    await this.leaveRoom(this.sessionId, '');
    this.sessionId = params.roomSlug;
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      publishDefaults: {
        videoCodec: undefined,
      },
    });

    this.bindRoomEvents(this.room);
    this.connectionState = 'CONNECTING';
    this.emit({
      type: 'CONNECTED',
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      metadata: { connectionState: 'CONNECTING' },
    });

    await this.room.connect(params.livekitUrl, params.token, { autoSubscribe: true });
    this.connectedCount = this.room.remoteParticipants.size + 1;
    await this.tryStartAudio();

    return {
      sessionId: this.sessionId,
      participantId: this.room.localParticipant.identity,
      connectionQuality: 'GOOD',
    };
  }

  async tryStartAudio(): Promise<boolean> {
    if (!this.room) return false;
    try {
      await this.room.startAudio();
      this.audioBlocked = false;
      return true;
    } catch {
      this.audioBlocked = true;
      return false;
    }
  }

  async enableMicrophone(): Promise<void> {
    if (!this.room) throw new Error('Not connected to prayer.');
    await this.room.localParticipant.setMicrophoneEnabled(true);
  }

  async disableMicrophone(): Promise<void> {
    if (!this.room) return;
    await this.room.localParticipant.setMicrophoneEnabled(false);
  }

  async leaveRoom(_sessionId: string, _participantId: string): Promise<void> {
    this.audioElements.forEach((el) => {
      el.srcObject = null;
      el.remove();
    });
    this.audioElements.clear();
    if (this.room) {
      this.room.removeAllListeners();
      await this.room.disconnect();
    }
    this.room = null;
    this.connectionState = 'DISCONNECTED';
  }

  getIdentity(): string | null {
    return this.room?.localParticipant.identity ?? null;
  }

  /** identity -> true when that person currently has an unmuted microphone. */
  getMicStates(): Record<string, boolean> {
    const states: Record<string, boolean> = {};
    if (!this.room) return states;
    const collect = (identity: string, publication: { isMuted: boolean; track?: unknown } | undefined) => {
      states[identity] = Boolean(publication && !publication.isMuted && publication.track);
    };
    collect(
      this.room.localParticipant.identity,
      this.room.localParticipant.getTrackPublication(Track.Source.Microphone)
    );
    this.room.remoteParticipants.forEach((participant) => {
      collect(participant.identity, participant.getTrackPublication(Track.Source.Microphone));
    });
    return states;
  }

  private emitMicStateChanged(): void {
    this.emit({
      type: 'MIC_STATE_CHANGED',
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  async raiseHand(): Promise<void> {
    throw new Error('Use POST /api/sessions/:id/raise-hand');
  }
  async lowerHand(): Promise<void> {
    throw new Error('Use POST /api/sessions/:id/lower-hand');
  }
  async sendReaction(): Promise<void> {
    /* Reactions stay toast-only until chat/data events are used. */
  }

  async sendChatMessage(sessionId: string, displayName: string, body: string): Promise<void> {
    if (!this.room) {
      throw new Error('Not connected to prayer.');
    }
    const payload = {
      type: 'CHAT_MESSAGE' as const,
      sessionId: sessionId || this.sessionId,
      displayName,
      timestamp: new Date().toISOString(),
      metadata: { body },
    };
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    await this.room.localParticipant.publishData(bytes, { reliable: true });
    this.emit(payload);
  }
  async acceptSpeakerInvitation(): Promise<void> {
    throw new Error('Use POST /api/sessions/:id/speaker/accept');
  }
  async finishSpeaking(): Promise<void> {
    throw new Error('Use POST /api/sessions/:id/speaker/revoke');
  }
  async inviteSpeaker(): Promise<void> {
    throw new Error('Use POST /api/sessions/:id/speaker/invite');
  }
  async muteParticipant(): Promise<void> {
    throw new Error('Use POST /api/sessions/:id/participants/:id/mute');
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

  private bindRoomEvents(room: Room): void {
    room.on(RoomEvent.ConnectionStateChanged, (state) => {
      this.connectionState = mapConnectionState(state);
      const type =
        this.connectionState === 'DISCONNECTED' || this.connectionState === 'FAILED'
          ? 'DISCONNECTED'
          : 'CONNECTED';
      this.emit({
        type,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        metadata: { connectionState: this.connectionState },
      });
    });

    room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
      if (track.kind !== Track.Kind.Audio) {
        track.stop();
        return;
      }
      this.attachAudio(track, participant.identity);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
      if (track.kind === Track.Kind.Audio) {
        this.detachAudio(participant.identity);
      }
    });

    room.on(RoomEvent.ParticipantConnected, () => {
      this.connectedCount = room.remoteParticipants.size + 1;
      this.emit({
        type: 'PARTICIPANT_JOINED',
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        metadata: { connectedNow: this.connectedCount },
      });
    });

    room.on(RoomEvent.ParticipantDisconnected, () => {
      this.connectedCount = room.remoteParticipants.size + 1;
      this.emit({
        type: 'PARTICIPANT_LEFT',
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        metadata: { connectedNow: this.connectedCount },
      });
    });

    room.on(RoomEvent.DataReceived, (payload) => {
      try {
        const parsed = JSON.parse(new TextDecoder().decode(payload)) as RealtimeEventPayload & {
          type: string;
        };
        this.emit({
          ...parsed,
          sessionId: parsed.sessionId || this.sessionId,
          timestamp: parsed.timestamp || new Date().toISOString(),
        });
      } catch {
        /* ignore malformed data packets */
      }
    });

    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const speaker = speakers[0];
      if (!speaker) return;
      this.emit({
        type: 'ACTIVE_SPEAKER_CHANGED',
        sessionId: this.sessionId,
        displayName: speaker.name || speaker.identity,
        timestamp: new Date().toISOString(),
      });
    });

    const onMicChanged = () => this.emitMicStateChanged();
    room.on(RoomEvent.TrackMuted, onMicChanged);
    room.on(RoomEvent.TrackUnmuted, onMicChanged);
    room.on(RoomEvent.TrackPublished, onMicChanged);
    room.on(RoomEvent.TrackUnpublished, onMicChanged);
    room.on(RoomEvent.LocalTrackPublished, onMicChanged);
    room.on(RoomEvent.LocalTrackUnpublished, onMicChanged);
  }

  private attachAudio(track: RemoteTrack, identity: string): void {
    this.detachAudio(identity);
    const el = track.attach();
    el.autoplay = true;
    el.setAttribute('playsinline', 'true');
    el.style.display = 'none';
    document.body.appendChild(el);
    this.audioElements.set(identity, el);
    void el.play().catch(() => {
      this.audioBlocked = true;
    });
  }

  private detachAudio(identity: string): void {
    const el = this.audioElements.get(identity);
    if (el) {
      el.srcObject = null;
      el.remove();
      this.audioElements.delete(identity);
    }
  }

  private emit(event: RealtimeEventPayload): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[Sanctum LiveKit] listener error', err);
      }
    });
  }
}

export const livekitRealtimeProvider = new LiveKitRealtimeProvider();
