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
import { LogOut, Sun, Moon, Volume2, LayoutDashboard, Mic } from 'lucide-react';
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
    addToast,
  } = useApp();
  const { organization, isAuthenticated, user } = useAuth();

  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isPrayerRequestOpen, setIsPrayerRequestOpen] = useState(false);
  const [selfMuted, setSelfMuted] = useState(false);
  const [micOn, setMicOn] = useState(false);

  useEffect(() => {
    const stored = loadJoinSession();
    if (!stored) return;
    if (user?.id && stored.asGuest) {
      void reconnectToPrayer({ silent: true });
      return;
    }
    if (connectionState !== 'DISCONNECTED' && connectionState !== 'FAILED') return;
    void reconnectToPrayer({ silent: true });
  }, [user?.id]);

  const room = prayerRooms.find((item) => item.slug === roomSlug) || prayerRooms.find((item) => item.id === liveSession?.prayerRoomId) || prayerRooms[0];
  const liveConnected = connectionState === 'CONNECTED' || connectionState === 'RECONNECTING';
  const localParticipant = participants.find((item) => item.id === localParticipantId);
  const currentRole = localParticipant?.role === 'SPEAKER' ? 'SPEAKER' : 'LISTENER';
  const isMinister =
    localParticipant?.role === 'OWNER' ||
    localParticipant?.role === 'ADMIN' ||
    localParticipant?.role === 'PRAYER_LEADER' ||
    localParticipant?.role === 'TECHNICAL_ADMIN' ||
    user?.role === 'OWNER' ||
    user?.role === 'ADMIN' ||
    user?.role === 'PRAYER_LEADER' ||
    user?.role === 'TECHNICAL_ADMIN';
  const congregationMuted = liveSession?.congregationMuted !== false;
  const canDiscuss = !congregationMuted && !isMinister;
  const canUseMic = isMinister || canDiscuss;
  const showLiveMic = micOn && canUseMic;
  const prayerHasStarted = liveSession?.status === 'LIVE' || liveSession?.status === 'STARTING';
  const participantCount = liveConnected || localParticipantId ? connectedNow : undefined;
  const activeSpeaker = liveSession?.activeSpeakerName || 'Waiting for the next prayer leader.';
  const activeSpeakerTitle = liveSession?.activeSpeakerTitle || 'No speaker is live yet';

  useEffect(() => {
    if (congregationMuted && !isMinister && micOn) {
      void livekitRealtimeProvider.disableMicrophone();
      setMicOn(false);
      setSelfMuted(true);
    }
  }, [congregationMuted, isMinister, micOn]);

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
    if (localParticipantId && currentRole === 'SPEAKER') {
      await endSpeaker(localParticipantId);
    }
    try {
      await livekitRealtimeProvider.disableMicrophone();
    } catch {
      /* already muted or disconnected */
    }
    setMicOn(false);
    setSelfMuted(true);
  };

  const handleToggleLeadMic = async () => {
    try {
      if (micOn) {
        await livekitRealtimeProvider.disableMicrophone();
        setMicOn(false);
        setSelfMuted(true);
        return;
      }
      await livekitRealtimeProvider.enableMicrophone();
      setMicOn(true);
      setSelfMuted(false);
    } catch {
      setMicOn(false);
      setSelfMuted(true);
      addToast(
        isMinister
          ? 'Allow microphone access in the browser to lead in prayer.'
          : 'Allow microphone access in the browser to join the discussion.',
        'error'
      );
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
            aria-label={isAuthenticated ? 'Back to dashboard' : 'Leave prayer session'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] text-xs font-semibold text-[#B94A48] dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            {isAuthenticated ? <LayoutDashboard className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
            <span>{isAuthenticated ? 'Dashboard' : 'Leave'}</span>
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
              {isMinister
                ? showLiveMic
                  ? <>You are leading: <span className="font-semibold text-[#16251F] dark:text-[#F8F7F3]">{participantName}</span></>
                  : 'You are a minister. Turn on your microphone to speak.'
                : congregationMuted
                  ? 'Opening prayer — the congregation is muted. You will hear the pastor and ministers.'
                  : showLiveMic
                    ? 'Discussion is open. Your microphone is on.'
                    : 'Discussion is open. You may turn on your microphone.'}
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3 flex-wrap">
            <ParticipantCount
              count={participantCount}
              suffix="praying with you"
              size="sm"
              emptyLabel="Waiting for participants"
              localParticipantId={localParticipantId}
              names={participants
                .filter((person) => !person.leftAt)
                .map((person) => ({
                  id: person.id,
                  displayName: person.displayName,
                  role: person.role,
                }))}
            />
            <PrayerTimer seconds={liveSession?.durationSeconds || 0} size="sm" />
          </div>
        </div>

        {showLiveMic ? (
          <SpeakerLiveView
            participantName={participantName}
            participantCount={participantCount}
            selfMuted={selfMuted}
            onToggleSelfMute={() => {
              void (async () => {
                if (selfMuted) {
                  await livekitRealtimeProvider.enableMicrophone();
                  setMicOn(true);
                } else {
                  await livekitRealtimeProvider.disableMicrophone();
                  setMicOn(false);
                }
                setSelfMuted((prev) => !prev);
              })();
            }}
            onFinishPrayer={handleFinishPrayer}
          />
        ) : (
          <div className="space-y-3">
            <AudioVisualizerPlaceholder
              speakerName={isMinister ? 'Your turn to lead' : activeSpeaker}
              speakerTitle={
                isMinister
                  ? 'Turn on your microphone. The congregation is waiting to hear you.'
                  : congregationMuted
                    ? 'The congregation is muted for opening prayer.'
                    : 'Discussion is open. Turn on your microphone to join.'
              }
              isLive={prayerHasStarted}
            />
            {isMinister ? (
              <button
                type="button"
                onClick={() => void handleToggleLeadMic()}
                className="w-full py-4 px-6 rounded-2xl font-bold text-base bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic className="w-5 h-5" />
                <span>Turn on microphone to lead</span>
              </button>
            ) : canDiscuss ? (
              <button
                type="button"
                onClick={() => void handleToggleLeadMic()}
                className="w-full py-4 px-6 rounded-2xl font-bold text-base bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic className="w-5 h-5" />
                <span>Turn on microphone to join discussion</span>
              </button>
            ) : null}
          </div>
        )}

        {!showLiveMic && (
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

      <p className="w-full max-w-2xl mx-auto text-center text-[11px] text-[#68736D] dark:text-[#96A39D] leading-relaxed">
        Keep listening while you browse —{' '}
        <a
          href="https://github.com/th3on7in3gam3r/sanctum-live/blob/main/extension/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#203C32] dark:text-[#C9A35A] hover:underline"
        >
          install the Sanctum Live side panel
        </a>
        .
      </p>

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
