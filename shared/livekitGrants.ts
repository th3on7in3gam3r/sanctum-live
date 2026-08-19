import type { SessionRole } from '../shared/roles.ts';

export interface LiveKitTokenGrants {
  roomJoin: true;
  room: string;
  canPublish: boolean;
  canSubscribe: true;
  canPublishData: boolean;
  canPublishSources: Array<'microphone'>;
  roomAdmin: boolean;
}

export function buildLiveKitTokenGrants(options: {
  roomName: string;
  sessionRole: SessionRole;
  holdsSpeakerFloor: boolean;
}): LiveKitTokenGrants {
  const canPublish = options.sessionRole === 'SPEAKER' && options.holdsSpeakerFloor;
  const roomAdmin = options.sessionRole === 'HOST' || options.sessionRole === 'MODERATOR';

  return {
    roomJoin: true,
    room: options.roomName,
    canPublish,
    canSubscribe: true,
    canPublishData: true,
    canPublishSources: canPublish ? ['microphone'] : [],
    roomAdmin,
  };
}
