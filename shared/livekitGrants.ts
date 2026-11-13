import type { OrganizationRole, SessionRole } from '../shared/roles.ts';

export interface LiveKitTokenGrants {
  roomJoin: true;
  room: string;
  canPublish: boolean;
  canSubscribe: true;
  canPublishData: boolean;
  canPublishSources: Array<'microphone' | 'screen_share' | 'screen_share_audio'>;
  roomAdmin: boolean;
}

export function buildLiveKitTokenGrants(options: {
  roomName: string;
  sessionRole: SessionRole;
  holdsSpeakerFloor: boolean;
  congregationMuted?: boolean;
  speakerPermission?: string;
  orgRole?: OrganizationRole | null;
}): LiveKitTokenGrants {
  const roomAdmin = options.sessionRole === 'HOST' || options.sessionRole === 'MODERATOR';
  // Listeners / speakers publish via runtime grants (PTT, private prayer, or speaker floor).
  void options.holdsSpeakerFloor;
  void options.congregationMuted;
  const leaderOrg =
    options.orgRole === 'OWNER' || options.orgRole === 'ADMIN' || options.orgRole === 'PRAYER_LEADER';
  const canPublish = options.speakerPermission === 'PRAYER_LEADERS' ? leaderOrg : roomAdmin;

  return {
    roomJoin: true,
    room: options.roomName,
    canPublish,
    canSubscribe: true,
    canPublishData: true,
    // Hosts and moderators may also share their screen (slides, lyrics, a video).
    canPublishSources: canPublish
      ? roomAdmin
        ? ['microphone', 'screen_share', 'screen_share_audio']
        : ['microphone']
      : [],
    roomAdmin,
  };
}
