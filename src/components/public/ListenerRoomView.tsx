import React, { useEffect, useState } from 'react';
import { loadJoinSession } from '../../services/realtime/joinSessionStore';
import { SanctumLogo } from '../common/SanctumLogo';
import { LiveBadge } from '../common/LiveBadge';
import { ConnectionStatus } from '../common/ConnectionStatus';
import { ParticipantCount } from '../common/ParticipantCount';
import { PrayerTimer } from '../common/PrayerTimer';
import { AudioVisualizerPlaceholder } from '../common/AudioVisualizerPlaceholder';
import { ListenerReactionBar } from './ListenerReactionBar';
import { PrayerRequestModal } from './PrayerRequestModal';
import { InvitedSpeakerBanner } from './InvitedSpeakerBanner';
import { PrayerChatPanel } from './PrayerChatPanel';
import { SpeakerLiveView } from './SpeakerLiveView';
import { PostPrayerSummaryView } from './PostPrayerSummaryView';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Sun, Moon, Volume2 } from 'lucide-react';
import { DevelopmentPreviewBadge } from '../common/DevelopmentPreviewBadge';
import { RealtimeEngineStatus } from '../common/RealtimeEngineStatus';
import { livekitRealtimeProvider } from '../../services/realtime/livekitRealtimeProvider';
import { connectionStateToQuality } from '../../services/domain/sessionSnapshot';

interface ListenerRoomViewProps {
  participantName: string;
  roomSlug: string;
  onLeave: () => void;
}

export const ListenerRoomView: React.FC<ListenerRoomViewProps> = ({
  participantName,
  roomSlug,
  onLeave,
}) => {
  const {
    liveSession,
    prayerRooms,
    raiseHandAttendee,
    lowerHandAttendee,
    sendReactionAttendee,
    isDarkMode,
    toggleDarkMode,
    connectionState,
    connectedNow,
    audioBlocked,
    localParticipantId,
    pendingSpeakerInvite,
    prayerComplete,
    enablePrayerAudio,
    reconnectToPrayer,
    acceptSpeakerInvite,
    declineSpeakerInvite,
    endSpeaker,
    participants,
  } = useApp();
  const { organization } = useAuth();

  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isPrayerRequestOpen, setIsPrayerRequestOpen] = useState(false);
  const [selfMuted, setSelfMuted] = useState(false);

  useEffect(() => {
    if (connectionState !== 'DISCONNECTED' && connectionState !== 'FAILED') return;
    if (!loadJoinSession()) return;
    void reconnectToPrayer({ silent: true });
  }, []);

  const room = prayerRooms.find((item) => item.slug === roomSlug) || prayerRooms.find((item) => item.id === liveSession?.prayerRoomId) || prayerRooms[0];
  const liveConnected = connectionState === 'CONNECTED' || connectionState === 'RECONNECTING';
  const localParticipant = participants.find((item) => item.id === localParticipantId);
  const currentRole = localParticipant?.role === 'SPEAKER' ? 'SPEAKER' : 'LISTENER';
  const prayerHasStarted = liveSession?.status === 'LIVE' || liveSession?.status === 'STARTING';
  const participantCount = liveConnected || localParticipantId ? connectedNow : undefined;
  const activeSpeaker = liveSession?.activeSpeakerName || 'Waiting for the next prayer leader.';
  const activeSpeakerTitle = liveSession?.activeSpeakerTitle || 'No speaker is live yet';

  const handleToggleRaiseHand = async () => {
    if (!localParticipantId) return;
    if (isHandRaised) {
      await lowerHandAttendee(localParticipantId);
      setIsHandRaised(false);
    } else {
      await raiseHandAttendee(localParticipantId, participantName);
      setIsHandRaised(true);
    }
  };

  const handleFinishPrayer = async () => {
    if (localParticipantId) {
      await endSpeaker(localParticipantId);
    }
  };

  if (prayerComplete || liveSession?.status === 'ENDED') {
    return (
      <PostPrayerSummaryView
        room={room}
        session={liveSession}
        participantName={participantName}
        onExit={onLeave}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] flex flex-col justify-between p-4 sm:p-6 transition-colors select-none">
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between pb-4 border-b border-[#E5E6E1] dark:border-[#26362F]">
        <div className="flex items-center gap-3">
          <SanctumLogo size="sm" />
          <div className="hidden sm:block text-xs font-semibold text-[#68736D] dark:text-[#96A39D]">
            {organization.name}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ConnectionStatus
            status={connectionStateToQuality(connectionState)}
            showLabel={false}
            preview={!liveConnected}
            live={liveConnected}
          />
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-[#C9A35A]" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onLeave}
            aria-label="Leave prayer session"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] text-xs font-semibold text-[#B94A48] dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto my-auto py-4 sm:py-6 space-y-6">
        {connectionState === 'RECONNECTING' && (
          <div className="text-center text-sm font-semibold text-amber-800 dark:text-amber-300">
            Reconnecting to prayer…
          </div>
        )}
        {(connectionState === 'FAILED' || connectionState === 'DISCONNECTED') &&
          (localParticipantId || loadJoinSession()) && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => void reconnectToPrayer()}
              className="px-4 py-2 rounded-xl bg-[#203C32] text-white text-xs font-bold cursor-pointer"
            >
              Reconnect
            </button>
          </div>
        )}
        {audioBlocked && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => void enablePrayerAudio()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#C9A35A] text-xs font-bold text-[#203C32] dark:text-[#E8D8B2] cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              Enable Prayer Audio
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-left bg-white/60 dark:bg-[#17221D]/60 p-4 rounded-2xl border border-[#E5E6E1] dark:border-[#26362F]">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              {prayerHasStarted ? <LiveBadge size="sm" /> : null}
              <h1 className="text-lg sm:text-xl font-bold text-[#16251F] dark:text-[#F8F7F3]">
                {liveSession?.roomName || room?.name || 'Morning Prayer'}
              </h1>
            </div>
            <p className="text-xs text-[#68736D] dark:text-[#96A39D]">
              {liveSession?.status === 'WAITING'
                ? 'The Sanctuary is Open. Prayer will begin shortly.'
                : prayerHasStarted
                  ? <>Praying with: <span className="font-semibold text-[#16251F] dark:text-[#F8F7F3]">{participantName}</span> (Listener)</>
                  : 'Prayer has not started'}
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3 flex-wrap">
            <ParticipantCount count={participantCount} suffix="praying with you" size="sm" emptyLabel="Waiting for participants" />
            <PrayerTimer seconds={liveSession?.durationSeconds || 0} size="sm" />
          </div>
        </div>

        {currentRole === 'SPEAKER' ? (
          <SpeakerLiveView
            participantName={participantName}
            participantCount={participantCount}
            selfMuted={selfMuted}
            onToggleSelfMute={() => {
              void (async () => {
                if (selfMuted) await livekitRealtimeProvider.enableMicrophone();
                else await livekitRealtimeProvider.disableMicrophone();
                setSelfMuted((prev) => !prev);
              })();
            }}
            onFinishPrayer={handleFinishPrayer}
          />
        ) : (
          <AudioVisualizerPlaceholder
            speakerName={activeSpeaker}
            speakerTitle={activeSpeakerTitle}
            isLive={prayerHasStarted}
          />
        )}

        {currentRole === 'LISTENER' && (
          <ListenerReactionBar
            isHandRaised={isHandRaised}
            onSendAmen={() => sendReactionAttendee('AMEN')}
            onSendPraiseGod={() => sendReactionAttendee('PRAISE_GOD')}
            onToggleRaiseHand={handleToggleRaiseHand}
            onOpenPrayerRequest={() => setIsPrayerRequestOpen(true)}
          />
        )}

        <PrayerChatPanel sessionId={liveSession?.id} senderName={participantName} compact />
      </main>

      <footer className="w-full max-w-2xl mx-auto pt-4 text-center text-xs text-[#68736D] dark:text-[#96A39D] flex items-center justify-between border-t border-[#E5E6E1] dark:border-[#26362F]">
        <span className="text-[11px]">Sanctum Live™ — Prayer without barriers</span>
        <span className="text-[11px] inline-flex items-center gap-2">
          <RealtimeEngineStatus />
          {!liveConnected ? <DevelopmentPreviewBadge /> : <span>Media Engine Connected</span>}
        </span>
      </footer>

      <PrayerRequestModal
        isOpen={isPrayerRequestOpen}
        onClose={() => setIsPrayerRequestOpen(false)}
        defaultName={participantName}
        roomName={liveSession?.roomName}
      />

      <InvitedSpeakerBanner
        isOpen={Boolean(pendingSpeakerInvite)}
        onAccept={() => void acceptSpeakerInvite()}
        onDecline={() => void declineSpeakerInvite()}
      />
    </div>
  );
};
