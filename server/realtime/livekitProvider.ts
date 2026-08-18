import {
  RoomServiceClient,
  type CreateOptions,
} from 'livekit-server-sdk';
import { RealtimeUnavailable } from '../../shared/errors.ts';
import { env, isLiveKitConfigured } from '../env.ts';

export interface ILiveKitRealtimeProvider {
  createRoom(name: string): Promise<void>;
  deleteRoom(name: string): Promise<void>;
  removeParticipant(roomName: string, identity: string): Promise<void>;
  updatePublishPermission(roomName: string, identity: string, canPublish: boolean): Promise<void>;
  muteParticipant(roomName: string, identity: string): Promise<void>;
}

function toHttpUrl(livekitUrl: string): string {
  return livekitUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
}

function requireClient(): RoomServiceClient {
  if (!isLiveKitConfigured()) {
    throw RealtimeUnavailable();
  }
  return new RoomServiceClient(toHttpUrl(env.livekitUrl!), env.livekitApiKey!, env.livekitApiSecret!);
}

export class LiveKitRealtimeProvider implements ILiveKitRealtimeProvider {
  async createRoom(name: string): Promise<void> {
    const client = requireClient();
    const options: CreateOptions = {
      name,
      emptyTimeout: 60 * 30,
      maxParticipants: 10_000,
    };
    await client.createRoom(options);
  }

  async deleteRoom(name: string): Promise<void> {
    const client = requireClient();
    await client.deleteRoom(name);
  }

  async removeParticipant(roomName: string, identity: string): Promise<void> {
    const client = requireClient();
    await client.removeParticipant(roomName, identity);
  }

  async updatePublishPermission(roomName: string, identity: string, canPublish: boolean): Promise<void> {
    const client = requireClient();
    await client.updateParticipant(roomName, identity, undefined, {
      canSubscribe: true,
      canPublish,
      canPublishData: true,
    });
  }

  async muteParticipant(roomName: string, identity: string): Promise<void> {
    const client = requireClient();
    const participant = await client.getParticipant(roomName, identity);
    const tracks = participant.tracks ?? [];
    await Promise.all(
      tracks
        .filter((track) => track.sid && !track.muted)
        .map((track) => client.mutePublishedTrack(roomName, identity, track.sid, true))
    );
  }
}

export function getLiveKitProvider(): ILiveKitRealtimeProvider {
  return new LiveKitRealtimeProvider();
}
