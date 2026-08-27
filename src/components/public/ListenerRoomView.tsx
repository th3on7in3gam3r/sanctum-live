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
import { LogOut, Sun, Moon, Volume2, LayoutDashboard, Mic, MicOff, CircleHelp } from 'lucide-react';
import { DevelopmentPreviewBadge } from '../common/DevelopmentPreviewBadge';
import { RealtimeEngineStatus } from '../common/RealtimeEngineStatus';
import { LocalMicStatus } from '../common/LocalMicStatus';
import { livekitRealtimeProvider } from '../../services/realtime/livekitRealtimeProvider';
import { connectionStateToQuality } from '../../services/domain/sessionSnapshot';
import { useTour } from '../../hooks/useTour';
import { TOUR_IDS } from '../../tour/tourIds';
import { listenerRoomTourSteps } from '../../tour/listenerRoomTour';

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
    startPtt,
    endPtt,
  } = useApp();
  const { organization, isAuthenticated, user } = useAuth();

  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isPrayerRequestOpen, setIsPrayerRequestOpen] = useState(false);
  const [selfMuted, setSelfMuted] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [pttHolding, setPttHolding] = useState(false);
  const { startTour } = useTour(TOUR_IDS.listenerRoom, listenerRoomTourSteps, { delayMs: 900 });

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
  const privateWithMe =
    Boolean(liveSession?.privatePrayer) &&
    liveSession?.privatePrayer?.memberParticipantId === localParticipantId;
  const canUseMic = isMinister || canDiscuss || privateWithMe;
  const showLiveMic = micOn && canUseMic;
  const prayerHasStarted = liveSession?.status === 'LIVE' || liveSession?.status === 'STARTING';
  const participantCount = liveConnected || localParticipantId ? connectedNow : undefined;
  const activeSpeaker = liveSession?.activeSpeakerName || 'Waiting for the next prayer leader.';
  const activeSpeakerTitle = liveSession?.activeSpeakerTitle || 'No speaker is live yet';

  useEffect(() => {
    const syncLocalMic = () => {
      const status = livekitRealtimeProvider.getLocalMicStatus();
      setMicOn(status.publishing && !status.muted);
      setSelfMuted(!status.publishing || status.muted);
    };
    syncLocalMic();
    const unsubscribe = livekitRealtimeProvider.subscribe(syncLocalMic);
    const timer = window.setInterval(syncLocalMic, 1000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [liveConnected]);

  useEffect(() => {
    if (congregationMuted && !isMinister && !privateWithMe && micOn) {
      void livekitRealtimeProvider.disableMicrophone();
      setMicOn(false);
      setSelfMuted(true);
      setPttHolding(false);
    }
  }, [congregationMuted, isMinister, privateWithMe, micOn]);

  const prevCongregationMuted = React.useRef(congregationMuted);
  useEffect(() => {
    const wasMuted = prevCongregationMuted.current;
    prevCongregationMuted.current = congregationMuted;
    if (wasMuted && !congregationMuted && !isMinister) {
      addToast('Discussion PTT is open. Press and hold to speak.', 'success');
    }
    if (!wasMuted && congregationMuted && !isMinister) {
      addToast('Sermon mode — congregation microphones are locked again.', 'info');
    }
  }, [congregationMuted, isMinister, addToast]);

  const handlePttDown = async () => {
    if (!localParticipantId || !canDiscuss || privateWithMe) return;
    setPttHolding(true);
    try {
      await startPtt(localParticipantId);
    } catch {
      setPttHolding(false);
    }
  };

  const handlePttUp = async () => {
    if (!localParticipantId || !pttHolding) return;
    setPttHolding(false);
    await endPtt(localParticipantId);
  };
  useEffect(() => {
    return livekitRealtimeProvider.subscribe((event) => {
      if (event.type !== 'PARTICIPANT_MUTED') return;
      if (event.metadata?.muted === false) return;
      if (!event.participantId || event.participantId !== localParticipantId) return;
      setMicOn(false);
      setSelfMuted(true);
    });
  }, [localParticipantId]);

  const handleToggleRaiseHand = async () => {
    if (!localParticipantId) return;
    if (isHandRaised) {
      await lowerHandAttendee(localParticipantId);
      setIsHandRaised(false);
    } else {
      const raised = await raiseHandAttendee(localParticipantId, participantName);
      setIsHandRaised(raised);
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
          {room?.logoUrl || organization.logoUrl ? (
            <img
              src={room?.logoUrl || organization.logoUrl}
              alt=""
              className="w-9 h-9 rounded-xl object-cover border border-[#E5E6E1] dark:border-[#26362F] bg-white dark:bg-[#17221D]"
            />
          ) : (
            <SanctumLogo size="sm" />
          )}
          <div className="hidden sm:block text-xs font-semibold text-[#68736D] dark:text-[#96A39D]">
            {organization.name}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LocalMicStatus locked={!canUseMic} compact />
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
            type="button"
            onClick={() => startTour()}
            aria-label="Show prayer room tutorial"
            className="p-2 rounded-xl text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <CircleHelp className="w-4 h-4" />
          </button>
          <button
            onClick={onLeave}
            aria-label={isAuthenticated ? 'Back to dashboard' : 'Leave prayer session'}
            data-tour="listener-leave"
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
              data-tour="listener-enable-audio"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#C9A35A] text-xs font-bold text-[#203C32] dark:text-[#E8D8B2] cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              Enable Prayer Audio
            </button>
          </div>
        )}

        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-left bg-white/60 dark:bg-[#17221D]/60 p-4 rounded-2xl border border-[#E5E6E1] dark:border-[#26362F]"
          data-tour="listener-welcome"
        >
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              {prayerHasStarted ? <LiveBadge size="sm" /> : null}
              <h1 className="text-lg sm:text-xl font-bold text-[#16251F] dark:text-[#F8F7F3]">
                {liveSession?.roomName || room?.name || 'Morning Prayer'}
              </h1>
            </div>
            <p className="text-xs text-[#68736D] dark:text-[#96A39D]">
              {privateWithMe
                ? 'Pastor is praying with you privately — only you two can hear each other.'
                : isMinister
                  ? showLiveMic
                    ? <>You are leading: <span className="font-semibold text-[#16251F] dark:text-[#F8F7F3]">{participantName}</span></>
                    : 'You are a minister. Turn on your microphone to speak.'
                  : congregationMuted
                    ? 'Sermon — the congregation is muted. You will hear the pastor and ministers.'
                    : pttHolding || showLiveMic
                      ? 'You are speaking. Release to stop.'
                      : 'Discussion PTT is open. Press and hold to speak.'}
            </p>
            {!isMinister && (
              <p
                className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  privateWithMe
                    ? 'bg-[#C9A35A]/20 text-[#203C32] dark:text-[#E8D8B2]'
                    : congregationMuted
                      ? 'bg-[#B94A48]/10 text-[#B94A48]'
                      : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {privateWithMe ? (
                  <>Private prayer</>
                ) : (
                  <>
                    {congregationMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    {congregationMuted ? 'Sermon mode' : 'Discussion PTT'}
                  </>
                )}
              </p>
            )}
            <div className="mt-2">
              <LocalMicStatus locked={!canUseMic} />
            </div>
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

        {privateWithMe && (
          <div className="w-full py-4 px-4 rounded-2xl text-center border border-[#C9A35A]/40 bg-[#C9A35A]/10 space-y-1">
            <p className="text-sm font-bold text-[#16251F] dark:text-[#F8F7F3]">Private prayer with your pastor</p>
            <p className="text-xs text-[#68736D] dark:text-[#96A39D]">
              Only you and the host can hear this exchange. Speak normally — your mic is open for this private moment.
            </p>
          </div>
        )}

        {isMinister && canUseMic && (
          <button
            type="button"
            onClick={() => void handleToggleLeadMic()}
            data-tour="listener-mic"
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer ${
              showLiveMic && !selfMuted
                ? 'bg-[#B94A48] hover:bg-red-700 text-white'
                : 'bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814]'
            }`}
          >
            {showLiveMic && !selfMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{showLiveMic && !selfMuted ? 'Mute microphone' : 'Unmute microphone to lead'}</span>
          </button>
        )}

        {canDiscuss && !privateWithMe && (
          <button
            type="button"
            data-tour="listener-mic"
            onPointerDown={(e) => {
              e.preventDefault();
              void handlePttDown();
            }}
            onPointerUp={() => void handlePttUp()}
            onPointerLeave={() => {
              if (pttHolding) void handlePttUp();
            }}
            onPointerCancel={() => void handlePttUp()}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full py-6 px-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 cursor-pointer select-none touch-none ${
              pttHolding
                ? 'bg-emerald-600 text-white scale-[0.98]'
                : 'bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814]'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span>{pttHolding ? 'Speaking… release to stop' : 'Hold to speak'}</span>
          </button>
        )}

        {!canUseMic && (
          <div
            data-tour="listener-mic-locked"
            className="w-full py-3 px-4 rounded-2xl text-center text-xs font-medium text-[#68736D] dark:text-[#96A39D] border border-dashed border-[#E5E6E1] dark:border-[#26362F] bg-white/40 dark:bg-[#17221D]/40 flex items-center justify-center gap-2"
          >
            <MicOff className="w-4 h-4 text-[#B94A48] shrink-0" />
            Your microphone stays off until the pastor opens Discussion PTT.
          </div>
        )}

        {showLiveMic && isMinister ? (
          <SpeakerLiveView
            participantName={participantName}
            participantCount={participantCount}
            selfMuted={selfMuted}
            onToggleSelfMute={() => void handleToggleLeadMic()}
            onFinishPrayer={handleFinishPrayer}
          />
        ) : (
          <div className="space-y-3">
            <AudioVisualizerPlaceholder
              speakerName={isMinister ? 'Your turn to lead' : activeSpeaker}
              speakerTitle={
                privateWithMe
                  ? 'Private prayer — only you and the host hear this.'
                  : isMinister
                    ? 'Turn on your microphone. The congregation is waiting to hear you.'
                    : congregationMuted
                      ? 'Sermon mode — listen as the pastor leads.'
                      : 'Discussion PTT — press and hold to speak.'
              }
              isLive={prayerHasStarted}
            />
          </div>
        )}

        {!showLiveMic && (
          <div data-tour="listener-reactions">
            <ListenerReactionBar
              isHandRaised={isHandRaised}
              onSendAmen={() => sendReactionAttendee('AMEN')}
              onSendPraiseGod={() => sendReactionAttendee('PRAISE_GOD')}
              onToggleRaiseHand={handleToggleRaiseHand}
              onOpenPrayerRequest={() => setIsPrayerRequestOpen(true)}
            />
          </div>
        )}

        <div data-tour="listener-chat">
          <PrayerChatPanel
            sessionId={liveSession?.id || loadJoinSession()?.sessionId}
            senderName={participantName}
            compact
          />
        </div>
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
