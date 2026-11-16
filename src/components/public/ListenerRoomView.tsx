import React, { useEffect, useState } from 'react';
import { ScreenShareStage } from '../realtime/ScreenShareStage';
import { loadJoinSession } from '../../services/realtime/joinSessionStore';
import { BrandLockup } from '@plcc/brand/BrandLockup';
import { sanctumTheme } from './ChurchWordmark';
import { churchSiteUrl } from '../../lib/appMode';
import { ConnectionStatus } from '../common/ConnectionStatus';
import { PrayerTimer } from '../common/PrayerTimer';
import { PrayerRequestModal } from './PrayerRequestModal';
import { InvitedSpeakerBanner } from './InvitedSpeakerBanner';
import { PrayerChatPanel } from './PrayerChatPanel';
import { SpeakerLiveView } from './SpeakerLiveView';
import { PostPrayerSummaryView } from './PostPrayerSummaryView';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { isClientMinister } from '../../lib/permissions';
import { LogOut, Sun, Moon, Volume2, LayoutDashboard, Mic, MicOff, CircleHelp, Hand, Headphones, FileText, Check, Users, Info, ShieldCheck, Search, Megaphone, X } from 'lucide-react';
import { DevelopmentPreviewBadge } from '../common/DevelopmentPreviewBadge';
import { RealtimeEngineStatus } from '../common/RealtimeEngineStatus';
import { LocalMicStatus } from '../common/LocalMicStatus';
import { sanctumApi } from '../../services/api/sanctumApi';
import { livekitRealtimeProvider } from '../../services/realtime/livekitRealtimeProvider';
import { connectionStateToQuality } from '../../services/domain/sessionSnapshot';
import { useTour } from '../../hooks/useTour';
import { TOUR_IDS } from '../../tour/tourIds';
import { listenerRoomTourSteps } from '../../tour/listenerRoomTour';
import { ControlRoomLink } from './ControlRoomLink';
import { resolveSermonLeader } from '../../../shared/joinDisplay.ts';
import { broadcastSender, isBroadcastName } from '../../../shared/broadcast.ts';

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
  const { isAuthenticated, authReady, user } = useAuth();

  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isPrayerRequestOpen, setIsPrayerRequestOpen] = useState(false);
  const [canControl, setCanControl] = useState(false);
  const [altarFlags, setAltarFlags] = useState<{
    id?: string;
    name?: string;
    roomSermonLeaderName?: string;
    defaultSermonSpeaker?: string;
    speakerPermission?: string;
    prayerRequestsEnabled?: boolean;
    anonymousRequestsAllowed?: boolean;
    chatEnabled?: boolean;
  } | null>(null);
  const [selfMuted, setSelfMuted] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [pttActive, setPttActive] = useState(false);
  const [participantQuery, setParticipantQuery] = useState('');
  const [announcement, setAnnouncement] = useState<{ id: string; body: string; from: string; at: string } | null>(null);
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState<string | null>(null);
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

  // Moderator broadcasts: live, plus the latest one from the last 30 minutes for late joiners.
  const announcementSessionId = liveSession?.id || loadJoinSession()?.sessionId || '';
  useEffect(() => {
    if (!announcementSessionId) return;
    let cancelled = false;
    sanctumApi
      .getSession(announcementSessionId)
      .then((snapshot) => {
        if (cancelled) return;
        const recent = (snapshot.chatMessages || [])
          .filter((m: any) => isBroadcastName(m.displayName))
          .filter((m: any) => Date.now() - new Date(m.createdAt || m.timestamp || 0).getTime() < 30 * 60_000)
          .pop() as any;
        if (recent) {
          setAnnouncement((current) =>
            current ?? {
              id: String(recent.id),
              body: String(recent.body),
              from: broadcastSender(String(recent.displayName)),
              at: String(recent.createdAt || recent.timestamp || ''),
            }
          );
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [announcementSessionId]);

  useEffect(() => {
    return livekitRealtimeProvider.subscribe((event) => {
      if (event.type !== 'BROADCAST_MESSAGE') return;
      const body = typeof event.metadata?.body === 'string' ? event.metadata.body.trim() : '';
      if (!body) return;
      setAnnouncement({
        id: String(event.metadata?.messageId || event.timestamp),
        body,
        from: event.displayName || 'Moderator',
        at: event.timestamp,
      });
      try {
        navigator.vibrate?.(80);
      } catch {
        /* not supported */
      }
    });
  }, []);

  useEffect(() => {
    const onOnline = () => {
      void reconnectToPrayer({ silent: true });
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [reconnectToPrayer]);

  const matchedRoom =
    prayerRooms.find((item) => item.slug === roomSlug) ||
    prayerRooms.find((item) => item.id === liveSession?.prayerRoomId);
  const room = matchedRoom || prayerRooms[0];
  const leadersOnly = (matchedRoom?.speakerPermission || altarFlags?.speakerPermission) === 'PRAYER_LEADERS';
  const prayerRequestsOn = (matchedRoom?.prayerRequestsEnabled ?? altarFlags?.prayerRequestsEnabled) !== false;
  const anonymousRequestsOn = (matchedRoom?.anonymousRequestsAllowed ?? altarFlags?.anonymousRequestsAllowed) !== false;
  const chatOn = (matchedRoom?.chatEnabled ?? altarFlags?.chatEnabled) !== false;

  useEffect(() => {
    let cancelled = false;
    sanctumApi
      .getAltar(roomSlug)
      .then((result) => {
        if (!cancelled) {
          setCanControl(result.canControl === true);
          setAltarFlags(result.room);
        }
      })
      .catch(() => {
        if (!cancelled) setCanControl(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomSlug, authReady, isAuthenticated]);
  const liveConnected = connectionState === 'CONNECTED' || connectionState === 'RECONNECTING';
  const localParticipant = participants.find((item) => item.id === localParticipantId);
  const currentRole = localParticipant?.role === 'SPEAKER' ? 'SPEAKER' : 'LISTENER';
  const isInvitedSpeaker = currentRole === 'SPEAKER';
  const isMinister = isClientMinister(localParticipant?.role) || isClientMinister(user?.role);
  const congregationMuted = liveSession?.congregationMuted !== false;
  const canDiscuss = !congregationMuted && !isMinister;
  const privateWithMe =
    Boolean(liveSession?.privatePrayer) &&
    liveSession?.privatePrayer?.memberParticipantId === localParticipantId;
  const canUseMic = isMinister || isInvitedSpeaker || canDiscuss || privateWithMe;
  const showLiveMic = micOn && canUseMic;
  const prayerHasStarted = liveSession?.status === 'LIVE' || liveSession?.status === 'STARTING';
  const participantCount = liveConnected || localParticipantId ? connectedNow : undefined;
  const gatheringName = altarFlags?.name?.trim() || matchedRoom?.name || liveSession?.roomName || 'Prayer gathering';
  const sermonLeader = resolveSermonLeader(
    liveSession?.sermonLeaderName,
    altarFlags?.roomSermonLeaderName,
    altarFlags?.defaultSermonSpeaker
  );
  const floorHeld = Boolean(
    (liveSession?.activeSpeakerName || '').trim() ||
      liveSession?.pttParticipantId ||
      privateWithMe ||
      (showLiveMic && (isMinister || isInvitedSpeaker))
  );

  useEffect(() => {
    setIsHandRaised(Boolean(localParticipant?.isHandRaised));
  }, [localParticipant?.isHandRaised]);

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
    if (!congregationMuted || isMinister || isInvitedSpeaker || privateWithMe) return;
    if (pttActive && localParticipantId) {
      setPttActive(false);
      void endPtt(localParticipantId);
    }
    if (micOn) {
      void livekitRealtimeProvider.disableMicrophone();
      setMicOn(false);
      setSelfMuted(true);
    }
  }, [congregationMuted, isMinister, isInvitedSpeaker, privateWithMe, pttActive, micOn, localParticipantId, endPtt]);

  const prevCongregationMuted = React.useRef(congregationMuted);
  useEffect(() => {
    const wasMuted = prevCongregationMuted.current;
    prevCongregationMuted.current = congregationMuted;
    if (wasMuted && !congregationMuted && !isMinister) {
      addToast('The floor is open. Hold to speak.', 'success');
    }
    if (!wasMuted && congregationMuted && !isMinister) {
      addToast('Sermon mode — congregation microphones are locked again.', 'info');
    }
  }, [congregationMuted, isMinister, addToast]);

  const handleTogglePtt = async () => {
    if (!localParticipantId || !canDiscuss || privateWithMe) return;
    if (pttActive) {
      setPttActive(false);
      await endPtt(localParticipantId);
      return;
    }
    try {
      await startPtt(localParticipantId);
      setPttActive(true);
    } catch {
      setPttActive(false);
    }
  };
  useEffect(() => {
    return livekitRealtimeProvider.subscribe((event) => {
      if (event.type !== 'PARTICIPANT_MUTED') return;
      if (event.metadata?.muted === false) return;
      if (!event.participantId || event.participantId !== localParticipantId) return;
      setMicOn(false);
      setSelfMuted(true);
      setPttActive(false);
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
        isMinister || isInvitedSpeaker
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

  const people = participants.filter((person) => !person.leftAt);
  const leaders = people.filter((person) => isClientMinister(person.role) || person.role === 'SPEAKER');
  const others = people.filter((person) => !(isClientMinister(person.role) || person.role === 'SPEAKER'));
  const peopleQuery = participantQuery.trim().toLowerCase();
  const peopleShown = [...leaders, ...others].filter(
    (person) => !peopleQuery || person.displayName.toLowerCase().includes(peopleQuery)
  );
  const speakingName = liveSession?.activeSpeakerName?.trim() || '';
  const speaking = pttActive || (showLiveMic && !selfMuted) || privateWithMe;
  const micState: 'speaking' | 'open' | 'muted' = speaking ? 'speaking' : canUseMic ? 'open' : 'muted';
  const statusLine = privateWithMe
    ? 'Private prayer with your pastor'
    : speaking
      ? 'You are speaking'
      : canDiscuss
        ? 'The floor is open'
        : isMinister || isInvitedSpeaker
          ? 'Your microphone is off'
          : isHandRaised
            ? 'Hand raised — waiting for a moderator'
            : 'You are muted';

  return (
    <div data-theme={sanctumTheme(isDarkMode)} className="sanctum-screen sr-room flex min-h-screen select-none flex-col transition-colors">
      {/* Banner */}
      <header data-theme="dusk" className="sr-banner relative overflow-hidden">
        <img src="/brand/room-banner.webp" alt="" aria-hidden className="sr-banner-art" />
        <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLockup size="sm" href={churchSiteUrl()} className="min-w-0" />
            <span className="sr-eyebrow hidden whitespace-nowrap lg:inline">Prayer overflow room</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <LocalMicStatus locked={!canUseMic} compact className="sanctum-chip hidden sm:inline-flex" />
            <ConnectionStatus
              status={connectionStateToQuality(connectionState)}
              showLabel={false}
              preview={!liveConnected}
              live={liveConnected}
              className="sanctum-chip"
            />
            <button onClick={toggleDarkMode} aria-label="Toggle theme" className="sanctum-icon cursor-pointer rounded-xl p-2">
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => startTour()}
              aria-label="Show prayer room tutorial"
              className="sanctum-icon cursor-pointer rounded-xl p-2"
            >
              <CircleHelp className="h-4 w-4" />
            </button>
            {isAuthenticated ? (
              <button
                onClick={onLeave}
                aria-label="Back to dashboard"
                className="sanctum-outline hidden cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:flex"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        {/* Main room card */}
        <main className="sanctum-surface sr-card flex min-w-0 flex-col gap-5 rounded-3xl p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" data-tour="listener-welcome">
            <div className="flex min-w-0 items-start gap-3">
              <span className="sr-orb-sm flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14">
                <Headphones className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-xl leading-tight sm:text-3xl">{gatheringName}</h1>
                <p className="sanctum-muted mt-1 text-xs sm:text-sm">
                  Audio prayer room · Overflow
                  {sermonLeader ? <> · Led by <strong>{sermonLeader}</strong></> : null}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
              {prayerHasStarted ? (
                <span className="sr-live inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold">
                  <span className="sr-live-dot h-2 w-2 rounded-full" /> LIVE
                </span>
              ) : (
                <span className="sanctum-chip rounded-lg px-3 py-1 text-xs font-bold">Waiting to begin</span>
              )}
              <span className="sanctum-muted inline-flex items-center gap-1.5 text-xs font-semibold sm:text-sm">
                <Users className="h-4 w-4" />
                {participantCount ?? people.length} {(participantCount ?? people.length) === 1 ? 'person' : 'people'}
                <span aria-hidden>·</span>
                <PrayerTimer seconds={liveSession?.durationSeconds || 0} size="sm" />
              </span>
            </div>
          </div>

          {announcement && dismissedAnnouncement !== announcement.id ? (
            <div role="status" aria-live="polite" className="sr-announce flex items-start gap-3 rounded-2xl p-4">
              <span className="sr-announce-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Megaphone className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="sr-announce-from text-[11px] font-extrabold uppercase tracking-wider">
                  Message from {announcement.from}
                </p>
                <p className="sr-announce-body mt-0.5 whitespace-pre-line break-words text-sm font-semibold sm:text-base">
                  {announcement.body}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDismissedAnnouncement(announcement.id)}
                aria-label="Dismiss message"
                className="sr-announce-x shrink-0 cursor-pointer rounded-full p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <ScreenShareStage />

          {connectionState === 'RECONNECTING' && (
            <div className="sanctum-chip rounded-full px-3 py-2 text-center text-sm font-semibold">Reconnecting…</div>
          )}
          {(connectionState === 'FAILED' || connectionState === 'DISCONNECTED') && (localParticipantId || loadJoinSession()) && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => void reconnectToPrayer()}
                className="sanctum-accent cursor-pointer rounded-xl px-4 py-2 text-xs font-bold"
              >
                Reconnect
              </button>
            </div>
          )}
          {audioBlocked && (
            <button
              type="button"
              onClick={() => void enablePrayerAudio()}
              data-tour="listener-enable-audio"
              className="sanctum-accent mx-auto inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold"
            >
              <Volume2 className="h-4 w-4" />
              Tap to hear the prayer
            </button>
          )}

          {showLiveMic && (isMinister || isInvitedSpeaker) ? (
            <SpeakerLiveView
              participantName={participantName}
              participantCount={participantCount}
              selfMuted={selfMuted}
              onToggleSelfMute={() => void handleToggleLeadMic()}
              onFinishPrayer={handleFinishPrayer}
            />
          ) : (
            <div className="flex flex-col items-center py-2 text-center sm:py-4">
              <div className={`sr-stage ${floorHeld || speaking ? 'is-active' : ''}`}>
                <span className="sr-wave sr-wave-l" aria-hidden>
                  {Array.from({ length: 9 }).map((_, n) => <i key={n} style={{ animationDelay: `${n * 0.11}s` }} />)}
                </span>
                <span className={`sr-orb sr-orb-${micState}`}>
                  {micState === 'muted' ? <MicOff className="h-12 w-12 sm:h-16 sm:w-16" /> : <Mic className="h-12 w-12 sm:h-16 sm:w-16" />}
                </span>
                <span className="sr-wave sr-wave-r" aria-hidden>
                  {Array.from({ length: 9 }).map((_, n) => <i key={n} style={{ animationDelay: `${n * 0.11}s` }} />)}
                </span>
              </div>
              <p className={`sr-status mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold sm:text-base sr-status-${micState}`}>
                {micState === 'muted' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {statusLine}
              </p>
              <p className="sanctum-muted mt-2 max-w-md text-sm">
                {floorHeld && speakingName
                  ? <>Now praying: <strong>{speakingName}</strong></>
                  : privateWithMe
                    ? 'Only you and the host can hear each other.'
                    : congregationMuted
                      ? sermonLeader
                        ? `Audio only · Listen as ${sermonLeader} leads`
                        : 'Audio only · Speaking by moderator approval'
                      : 'Audio only · The floor is open — tap to speak'}
              </p>
            </div>
          )}

          {/* Action tiles */}
          {!showLiveMic && (
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3" data-tour="listener-reactions">
              {!leadersOnly ? (
                <button
                  type="button"
                  onClick={() => void handleToggleRaiseHand()}
                  aria-pressed={isHandRaised}
                  className={`sr-tile ${isHandRaised ? 'is-on' : 'is-gold'}`}
                >
                  <span className="sr-tile-icon">{isHandRaised ? <Check className="h-5 w-5" /> : <Hand className="h-5 w-5" />}</span>
                  <span className="sr-tile-title">{isHandRaised ? 'Hand raised' : 'Raise hand'}</span>
                  <span className="sr-tile-sub">{isHandRaised ? 'Tap to lower' : 'Ask to pray aloud'}</span>
                </button>
              ) : (
                <div className="sr-tile is-off">
                  <span className="sr-tile-icon"><Hand className="h-5 w-5" /></span>
                  <span className="sr-tile-title">Leaders only</span>
                  <span className="sr-tile-sub">Prayer leaders speak</span>
                </div>
              )}

              {(isMinister || isInvitedSpeaker) && canUseMic ? (
                <button type="button" onClick={() => void handleToggleLeadMic()} data-tour="listener-mic" className="sr-tile is-gold">
                  <span className="sr-tile-icon"><Mic className="h-5 w-5" /></span>
                  <span className="sr-tile-title">Unmute</span>
                  <span className="sr-tile-sub">Lead in prayer</span>
                </button>
              ) : canDiscuss && !privateWithMe ? (
                <button
                  type="button"
                  onClick={() => void handleTogglePtt()}
                  data-tour="listener-mic"
                  className={`sr-tile ${pttActive ? 'is-on' : 'is-gold'}`}
                >
                  <span className="sr-tile-icon">{pttActive ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</span>
                  <span className="sr-tile-title">{pttActive ? 'Stop' : 'Speak'}</span>
                  <span className="sr-tile-sub">{pttActive ? 'Tap to stop' : 'The floor is open'}</span>
                </button>
              ) : (
                <div className="sr-tile is-off" data-tour="listener-mic-locked" aria-disabled>
                  <span className="sr-tile-icon"><Mic className="h-5 w-5" /></span>
                  <span className="sr-tile-title">Unmute</span>
                  <span className="sr-tile-sub">When approved</span>
                </div>
              )}

              {prayerRequestsOn ? (
                <button type="button" onClick={() => setIsPrayerRequestOpen(true)} className="sr-tile">
                  <span className="sr-tile-icon"><FileText className="h-5 w-5" /></span>
                  <span className="sr-tile-title">Prayer request</span>
                  <span className="sr-tile-sub">Send to the pastors</span>
                </button>
              ) : (
                <div className="sr-tile">
                  <span className="sr-tile-icon"><Volume2 className="h-5 w-5" /></span>
                  <span className="sr-tile-title">Listening</span>
                  <span className="sr-tile-sub">Audio only</span>
                </div>
              )}
            </div>
          )}

          {!showLiveMic && (
            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => sendReactionAttendee('AMEN')}
                aria-label="Say Amen"
                className="sanctum-outline cursor-pointer rounded-full px-4 py-2 text-sm font-semibold active:scale-95"
              >
                🙏 Amen
              </button>
              <button
                type="button"
                onClick={() => sendReactionAttendee('PRAISE_GOD')}
                aria-label="Praise God"
                className="sanctum-outline cursor-pointer rounded-full px-4 py-2 text-sm font-semibold active:scale-95"
              >
                ❤️ Praise God
              </button>
            </div>
          )}

          {canControl && altarFlags?.id ? (
            <div className="flex justify-center">
              <ControlRoomLink roomId={altarFlags.id} />
            </div>
          ) : null}

          <button
            onClick={onLeave}
            data-tour="listener-leave"
            className="sr-leave mx-auto mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full px-8 py-3 text-sm font-bold"
          >
            <LogOut className="h-4 w-4" />
            <span>Leave room</span>
          </button>
        </main>

        {/* Right rail */}
        <aside className="flex min-w-0 flex-col gap-5">
          <section className="sanctum-surface sr-card rounded-3xl p-5">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Info className="sr-gold h-5 w-5" />
              About this room
            </h2>
            <p className="sanctum-muted mt-2 text-sm">
              The overflow for our worldwide family when the main prayer room in Jordan is full.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5"><Headphones className="sr-gold h-4 w-4 shrink-0" />Audio only — no video</li>
              <li className="flex items-center gap-2.5"><MicOff className="sr-gold h-4 w-4 shrink-0" />Everyone joins muted</li>
              {!leadersOnly ? (
                <li className="flex items-center gap-2.5"><Hand className="sr-gold h-4 w-4 shrink-0" />Raise your hand to pray aloud</li>
              ) : null}
              <li className="flex items-center gap-2.5"><ShieldCheck className="sr-gold h-4 w-4 shrink-0" />Keep every prayer respectful and focused</li>
            </ul>
          </section>

          <section className="sanctum-surface sr-card rounded-3xl p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <Users className="sr-gold h-5 w-5" />
                In the room ({participantCount ?? people.length})
              </h2>
            </div>
            {people.length > 6 ? (
              <label className="sanctum-raised mt-3 flex items-center gap-2 rounded-xl px-3 py-2">
                <Search className="h-4 w-4 shrink-0" />
                <input
                  value={participantQuery}
                  onChange={(e) => setParticipantQuery(e.target.value)}
                  placeholder="Find someone"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </label>
            ) : null}
            {peopleShown.length ? (
              <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto pr-1">
                {peopleShown.slice(0, 80).map((person) => {
                  const leader = isClientMinister(person.role) || person.role === 'SPEAKER';
                  const isMe = person.id === localParticipantId;
                  return (
                    <li key={person.id} className="flex items-center gap-3 rounded-xl px-1.5 py-1.5">
                      <span className={`sr-avatar ${leader ? 'is-leader' : ''}`}>
                        {person.displayName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {person.displayName}{isMe ? ' (you)' : ''}
                      </span>
                      {leader ? (
                        <span className="sr-badge shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
                          {person.role === 'SPEAKER' ? 'Praying' : 'Moderator'}
                        </span>
                      ) : null}
                      {person.isHandRaised ? <Hand className="sr-gold h-4 w-4 shrink-0" aria-label="Hand raised" /> : null}
                      {person.isMuted === false || (person.role === 'SPEAKER') ? (
                        <Mic className="sr-ok h-4 w-4 shrink-0" aria-label="Can speak" />
                      ) : (
                        <MicOff className="sr-mute h-4 w-4 shrink-0" aria-label="Muted" />
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="sanctum-muted mt-3 text-sm">
                {people.length ? 'No one matches that name.' : 'People appear here as they join.'}
              </p>
            )}
          </section>

          <div data-tour="listener-chat">
            {chatOn && (
              <PrayerChatPanel sessionId={liveSession?.id || loadJoinSession()?.sessionId} senderName={participantName} compact />
            )}
          </div>
        </aside>
      </div>

      <footer
        className="sanctum-muted mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 border-t px-4 py-4 text-[11px] sm:px-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <span>Promised Land Christian Center · One family. Many nations. One purpose.</span>
        <span className="inline-flex items-center gap-2">
          <RealtimeEngineStatus />
          {!liveConnected ? <DevelopmentPreviewBadge /> : <span>Connected</span>}
        </span>
      </footer>

      <PrayerRequestModal
        isOpen={isPrayerRequestOpen && prayerRequestsOn}
        onClose={() => setIsPrayerRequestOpen(false)}
        defaultName={participantName}
        roomName={liveSession?.roomName}
        allowAnonymous={anonymousRequestsOn}
      />

      <InvitedSpeakerBanner
        isOpen={Boolean(pendingSpeakerInvite)}
        onAccept={() => void acceptSpeakerInvite()}
        onDecline={() => void declineSpeakerInvite()}
        canAccept={liveSession?.status === 'LIVE'}
      />
    </div>
  );
};
