import React, { useEffect, useState } from 'react';
import { ScreenShareStage } from '../realtime/ScreenShareStage';
import { loadJoinSession } from '../../services/realtime/joinSessionStore';
import { churchSiteUrl } from '../../lib/appMode';
import { ConnectionStatus } from '../common/ConnectionStatus';
import { PrayerRequestModal } from './PrayerRequestModal';
import { InvitedSpeakerBanner } from './InvitedSpeakerBanner';
import { PrayerChatPanel } from './PrayerChatPanel';
import { SpeakerLiveView } from './SpeakerLiveView';
import { PostPrayerSummaryView } from './PostPrayerSummaryView';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { isClientMinister } from '../../lib/permissions';
import { LogOut, Volume2, LayoutDashboard, Mic, MicOff, CircleHelp, Hand, Headphones, Check, Users, Info, ShieldCheck, Search, Megaphone, X, Radio, LayoutGrid, HandHeart, BookHeart, Crown } from 'lucide-react';
import { sanctumApi } from '../../services/api/sanctumApi';
import { livekitRealtimeProvider } from '../../services/realtime/livekitRealtimeProvider';
import { connectionStateToQuality } from '../../services/domain/sessionSnapshot';
import { useTour } from '../../hooks/useTour';
import { TOUR_IDS } from '../../tour/tourIds';
import { listenerRoomTourSteps } from '../../tour/listenerRoomTour';
import { ControlRoomLink } from './ControlRoomLink';
import { resolveSermonLeader } from '../../../shared/joinDisplay.ts';
import { PLCC_ONE_ORIGIN } from '../../lib/plccLinks';
import { PrayerGuidelinesSheet } from './PrayerGuidelinesSheet';
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
  const [peopleSearchOpen, setPeopleSearchOpen] = useState(false);
  const [listenOnly, setListenOnly] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
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
  const isLeader = (role?: string) => isClientMinister(role) || role === 'SPEAKER';
  const peopleQuery = participantQuery.trim().toLowerCase();
  const peopleShown = [...people]
    .sort(
      (a, b) =>
        Number(isClientMinister(b.role)) - Number(isClientMinister(a.role)) ||
        Number(Boolean(b.isHandRaised)) - Number(Boolean(a.isHandRaised)) ||
        a.displayName.localeCompare(b.displayName)
    )
    .filter((person) => !peopleQuery || person.displayName.toLowerCase().includes(peopleQuery));
  const peopleCount = participantCount ?? people.length;
  const speakingName = liveSession?.activeSpeakerName?.trim() || '';
  const speaking = pttActive || (showLiveMic && !selfMuted) || privateWithMe;
  const orbState: 'speaking' | 'open' | 'muted' = speaking ? 'speaking' : canUseMic && !listenOnly ? 'open' : 'muted';
  const statusLine = privateWithMe
    ? 'Private prayer with your pastor'
    : listenOnly
      ? 'Listening only'
      : speaking
        ? 'You are speaking'
        : canDiscuss
          ? 'The floor is open'
          : isMinister || isInvitedSpeaker
            ? 'Your microphone is off'
            : isHandRaised
              ? 'Hand raised — please wait'
              : 'You are Muted';
  const initials = (name: string) =>
    name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'M';
  const openNewTab = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');
  const nav: Array<{ key: string; label: string; Icon: React.ElementType; onClick: () => void; active?: boolean }> = [
    { key: 'room', label: 'Prayer Room', Icon: Radio, active: true, onClick: () => undefined },
    { key: 'rooms', label: 'All Rooms', Icon: LayoutGrid, onClick: () => openNewTab('/join') },
    ...(prayerRequestsOn ? [{ key: 'request', label: 'Prayer Request', Icon: HandHeart, onClick: () => setIsPrayerRequestOpen(true) }] : []),
    { key: 'wall', label: 'Prayer Wall', Icon: BookHeart, onClick: () => openNewTab(`${PLCC_ONE_ORIGIN}/#/community/prayer-wall`) },
    { key: 'guide', label: 'Guidelines', Icon: CircleHelp, onClick: () => setGuidelinesOpen(true) },
  ];

  const handleToggleListenOnly = async () => {
    if (listenOnly) {
      setListenOnly(false);
      return;
    }
    if (pttActive && localParticipantId) {
      setPttActive(false);
      await endPtt(localParticipantId);
    }
    if (micOn) {
      try {
        await livekitRealtimeProvider.disableMicrophone();
      } catch {
        /* already off */
      }
      setMicOn(false);
      setSelfMuted(true);
    }
    setListenOnly(true);
  };

  return (
    <div className="pr-shell min-h-screen select-none" style={{ height: 'auto', minHeight: '100vh' }}>
      <header className="pr-header">
        <div className="pr-header-inner">
          <a href={churchSiteUrl()} className="pr-brand" aria-label="Promised Land Christian Center">
            <img src="/prayer-room/prayer-emblem.png" alt="" aria-hidden className="pr-emblem" />
            <div className="min-w-0">
              <p className="pr-brand-name">PLCC SANCTUM</p>
              <p className="pr-brand-sub">Prayer Overflow Room</p>
            </div>
          </a>
          <div className="pr-church">
            <p className="pr-church-name">Promised Land Christian Center</p>
            <p className="pr-church-tag">One family. Many nations. One purpose.</p>
          </div>
          <div className="pr-header-actions">
            <span data-theme="light" className="pr-desktop-only">
              <ConnectionStatus
                status={connectionStateToQuality(connectionState)}
                showLabel={false}
                preview={!liveConnected}
                live={liveConnected}
                className="sanctum-chip"
              />
            </span>
            <button type="button" onClick={() => setGuidelinesOpen(true)} className="pr-icon-btn pr-desktop-only cursor-pointer" aria-label="Guidelines">
              <CircleHelp size={24} aria-hidden />
            </button>
            <button type="button" onClick={() => startTour()} className="pr-icon-btn cursor-pointer" aria-label="Show prayer room tutorial">
              <Info size={22} aria-hidden />
            </button>
            <button
              type="button"
              onClick={onLeave}
              className="pr-icon-btn is-solid cursor-pointer"
              aria-label={isAuthenticated ? 'Back to dashboard' : 'Leave prayer room'}
            >
              {isAuthenticated ? <LayoutDashboard size={22} aria-hidden /> : <X size={22} aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      <nav className="pr-chips" aria-label="Prayer room">
        {nav.map(({ key, label, Icon, onClick, active }) => (
          <button key={key} type="button" onClick={onClick} className={`pr-chip cursor-pointer ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={16} aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      <div className="pr-body">
        <aside className="pr-sidebar" aria-label="Prayer room">
          <nav className="pr-nav">
            {nav.map(({ key, label, Icon, onClick, active }) => (
              <button key={key} type="button" onClick={onClick} className={`pr-nav-item cursor-pointer ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                <Icon size={22} aria-hidden />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="pr-content">
          <div className="pr-panel">
            <main className="pr-room">
              <div className="pr-titlebar" data-tour="listener-welcome">
                <div className="flex min-w-0 items-center gap-3 lg:gap-4">
                  <span className="pr-room-icon"><Headphones className="h-6 w-6 lg:h-9 lg:w-9" aria-hidden /></span>
                  <div className="min-w-0">
                    <p className="pr-room-title line-clamp-2">{gatheringName}</p>
                    <p className="pr-room-sub">
                      Audio Prayer Room • Overflow (Additional Capacity)
                      <Info size={16} aria-hidden className="opacity-70" />
                    </p>
                  </div>
                </div>
                <div className="pr-titlebar-meta flex shrink-0 flex-col items-end gap-2">
                  {prayerHasStarted ? (
                    <span className="pr-live"><i aria-hidden /> LIVE</span>
                  ) : (
                    <span className="pr-live" style={{ background: '#6b7a72' }}>WAITING</span>
                  )}
                  <span className="pr-count">
                    <Users className="h-4 w-4 lg:h-6 lg:w-6" aria-hidden /> {peopleCount} {peopleCount === 1 ? 'Participant' : 'Participants'}
                  </span>
                </div>
              </div>

              {announcement && dismissedAnnouncement !== announcement.id ? (
                <div role="status" aria-live="polite" className="pr-announce">
                  <span className="pr-info-icon" style={{ width: 40, height: 40 }}><Megaphone className="h-5 w-5" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#7a5a1c]">Message from {announcement.from}</p>
                    <p className="mt-0.5 whitespace-pre-line break-words text-sm font-semibold sm:text-base">{announcement.body}</p>
                  </div>
                  <button type="button" onClick={() => setDismissedAnnouncement(announcement.id)} aria-label="Dismiss message" className="shrink-0 cursor-pointer rounded-full p-1.5 hover:bg-black/10">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : null}

              <div data-theme="light"><ScreenShareStage /></div>

              {connectionState === 'RECONNECTING' ? <p className="pr-notice text-center font-semibold">Reconnecting…</p> : null}
              {(connectionState === 'FAILED' || connectionState === 'DISCONNECTED') && (localParticipantId || loadJoinSession()) ? (
                <button type="button" onClick={() => void reconnectToPrayer()} className="pr-tool mx-auto cursor-pointer">
                  Reconnect
                </button>
              ) : null}
              {audioBlocked ? (
                <button
                  type="button"
                  onClick={() => void enablePrayerAudio()}
                  data-tour="listener-enable-audio"
                  className="mx-auto inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full bg-[#d9b45e] px-6 text-base font-bold text-[#1d2414]"
                >
                  <Volume2 className="h-5 w-5" aria-hidden />
                  Tap to hear the prayer
                </button>
              ) : null}
              {privateWithMe ? (
                <p className="pr-notice is-strong text-center">
                  Private prayer with your pastor — only you and the host can hear each other.
                </p>
              ) : null}

              {showLiveMic && (isMinister || isInvitedSpeaker) ? (
                <div data-theme="light">
                  <SpeakerLiveView
                    participantName={participantName}
                    participantCount={participantCount}
                    selfMuted={selfMuted}
                    onToggleSelfMute={() => void handleToggleLeadMic()}
                    onFinishPrayer={handleFinishPrayer}
                  />
                </div>
              ) : (
                <div className="pr-stage">
                  <div className="pr-orb-row">
                    <span className={`pr-wave is-left ${floorHeld || speaking ? 'is-active' : ''}`} aria-hidden>
                      {Array.from({ length: 9 }).map((_, n) => <i key={n} style={{ animationDelay: `${n * 0.11}s` }} />)}
                    </span>
                    <span className={`pr-orb ${orbState === 'open' ? 'is-open' : ''} ${orbState === 'speaking' ? 'is-open is-speaking' : ''}`}>
                      {orbState === 'muted' ? <MicOff aria-hidden /> : <Mic aria-hidden />}
                    </span>
                    <span className={`pr-wave ${floorHeld || speaking ? 'is-active' : ''}`} aria-hidden>
                      {Array.from({ length: 9 }).map((_, n) => <i key={n} style={{ animationDelay: `${n * 0.11}s` }} />)}
                    </span>
                  </div>
                  <p className={`pr-status ${orbState !== 'muted' ? 'is-open' : ''}`}>
                    {orbState === 'muted' ? (listenOnly ? <Volume2 size={20} aria-hidden /> : <MicOff size={20} aria-hidden />) : <Mic size={20} aria-hidden />}
                    {statusLine}
                  </p>
                  <p className="pr-hint">
                    {floorHeld && speakingName ? (
                      <>Now praying: <strong>{speakingName}</strong></>
                    ) : congregationMuted ? (
                      'Audio Only • By Moderator Approval'
                    ) : (
                      'Audio Only • The floor is open'
                    )}
                  </p>
                  {/* The audio bridge from Jordan is not built yet: say so honestly. */}
                  <span className="pr-bridge">
                    <Radio size={14} aria-hidden />
                    {sermonLeader ? `Overflow room led by ${sermonLeader}` : 'Overflow room with its own prayer leaders'}
                  </span>
                </div>
              )}

              {!showLiveMic ? (
                <div className="pr-tiles" data-tour="listener-reactions">
                  {!leadersOnly ? (
                    <button
                      type="button"
                      onClick={() => void handleToggleRaiseHand()}
                      aria-pressed={isHandRaised}
                      className={`pr-tile cursor-pointer ${isHandRaised ? 'is-on' : 'is-gold'}`}
                    >
                      <span className="pr-tile-icon">{isHandRaised ? <Check className="h-6 w-6 lg:h-7 lg:w-7" aria-hidden /> : <Hand className="h-6 w-6 lg:h-7 lg:w-7" aria-hidden />}</span>
                      <span className="pr-tile-title">{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
                      <span className="pr-tile-sub">{isHandRaised ? 'Tap to lower' : 'Request to Speak'}</span>
                    </button>
                  ) : (
                    <div className="pr-tile is-off">
                      <span className="pr-tile-icon"><Hand className="h-6 w-6 lg:h-7 lg:w-7" aria-hidden /></span>
                      <span className="pr-tile-title">Leaders only</span>
                      <span className="pr-tile-sub">Prayer leaders speak</span>
                    </div>
                  )}

                  {listenOnly ? (
                    <div className="pr-tile is-off" aria-disabled>
                      <span className="pr-tile-icon"><Mic className="h-6 w-6 lg:h-7 lg:w-7" aria-hidden /></span>
                      <span className="pr-tile-title">Unmute</span>
                      <span className="pr-tile-sub">(Listen only is on)</span>
                    </div>
                  ) : (isMinister || isInvitedSpeaker) && canUseMic ? (
                    <button type="button" onClick={() => void handleToggleLeadMic()} data-tour="listener-mic" className="pr-tile is-live cursor-pointer">
                      <span className="pr-tile-icon"><Mic className="h-6 w-6 lg:h-7 lg:w-7" aria-hidden /></span>
                      <span className="pr-tile-title">Unmute</span>
                      <span className="pr-tile-sub">Lead in prayer</span>
                    </button>
                  ) : canDiscuss && !privateWithMe ? (
                    <button
                      type="button"
                      onClick={() => void handleTogglePtt()}
                      data-tour="listener-mic"
                      className={`pr-tile cursor-pointer ${pttActive ? 'is-on' : 'is-live'}`}
                    >
                      <span className="pr-tile-icon">{pttActive ? <MicOff className="h-6 w-6 lg:h-7 lg:w-7" aria-hidden /> : <Mic className="h-6 w-6 lg:h-7 lg:w-7" aria-hidden />}</span>
                      <span className="pr-tile-title">{pttActive ? 'Stop' : 'Speak'}</span>
                      <span className="pr-tile-sub">{pttActive ? 'Tap to stop' : 'The floor is open'}</span>
                    </button>
                  ) : (
                    <div className="pr-tile is-off" data-tour="listener-mic-locked" aria-disabled>
                      <span className="pr-tile-icon"><Mic className="h-6 w-6 lg:h-7 lg:w-7" aria-hidden /></span>
                      <span className="pr-tile-title">Unmute</span>
                      <span className="pr-tile-sub">(When Approved)</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleToggleListenOnly()}
                    aria-pressed={listenOnly}
                    className={`pr-tile cursor-pointer ${listenOnly ? 'is-on' : ''}`}
                  >
                    <span className="pr-tile-icon"><Volume2 className="h-6 w-6 lg:h-7 lg:w-7" aria-hidden /></span>
                    <span className="pr-tile-title">Listen Only</span>
                    <span className="pr-tile-sub">{listenOnly ? 'On — tap to turn off' : 'Keep my mic off'}</span>
                  </button>
                </div>
              ) : null}

              {!showLiveMic ? (
                <div className="pr-tools">
                  {prayerRequestsOn ? (
                    <button type="button" onClick={() => setIsPrayerRequestOpen(true)} className="pr-tool cursor-pointer">
                      <HandHeart size={18} aria-hidden /> Prayer Request
                    </button>
                  ) : null}
                  <button type="button" onClick={() => sendReactionAttendee('AMEN')} aria-label="Say Amen" className="pr-tool cursor-pointer">
                    🙏 Amen
                  </button>
                  <button type="button" onClick={() => sendReactionAttendee('PRAISE_GOD')} aria-label="Praise God" className="pr-tool cursor-pointer">
                    ❤️ Praise God
                  </button>
                  {canControl && altarFlags?.id ? (
                    <span data-theme="light"><ControlRoomLink roomId={altarFlags.id} /></span>
                  ) : null}
                </div>
              ) : null}

              <button type="button" onClick={onLeave} data-tour="listener-leave" className="pr-leave cursor-pointer">
                <LogOut className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden />
                Leave Room
              </button>
            </main>

            <aside className="pr-side">
              <section className="pr-card">
                <h3 className="pr-card-title">
                  <span className="pr-info-icon"><Info size={16} aria-hidden /></span>
                  Prayer Room Information
                </h3>
                <p className="pr-card-text">Overflow prayer room for our worldwide family when the main room reaches capacity.</p>
                <ul className="pr-rules">
                  <li><Headphones size={22} aria-hidden />Audio only (no video)</li>
                  <li><MicOff size={22} aria-hidden />All participants are muted by default</li>
                  {!leadersOnly ? <li><Hand size={22} aria-hidden />Use Raise Hand to request to speak</li> : null}
                  <li><ShieldCheck size={22} aria-hidden />Please keep all prayers respectful and focused</li>
                </ul>
              </section>

              <section className="pr-card">
                <div className="pr-people-head">
                  <h3 className="pr-card-title">
                    <Users className="h-6 w-6" aria-hidden />
                    Participants ({peopleCount})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPeopleSearchOpen((v) => !v)}
                    className="pr-search-btn cursor-pointer"
                    aria-label="Search participants"
                    aria-expanded={peopleSearchOpen}
                  >
                    <Search size={20} aria-hidden />
                  </button>
                </div>
                {peopleSearchOpen ? (
                  <label className="pr-search">
                    <Search size={16} aria-hidden className="opacity-60" />
                    <input autoFocus value={participantQuery} onChange={(e) => setParticipantQuery(e.target.value)} placeholder="Find someone" aria-label="Find someone" />
                  </label>
                ) : null}
                <ul className="pr-people">
                  {peopleShown.slice(0, 120).map((person) => {
                    const isMe = person.id === localParticipantId;
                    const prayingNow = person.role === 'SPEAKER' || (speakingName && person.displayName === speakingName);
                    const canSpeak = person.isMuted === false || person.role === 'SPEAKER';
                    return (
                      <li key={person.id} className="pr-person">
                        <span className={`pr-avatar ${prayingNow ? 'is-speaking' : ''}`}>{initials(person.displayName)}</span>
                        <span className="pr-person-name">{person.displayName}{isMe ? ' (you)' : ''}</span>
                        {person.isHandRaised ? <Hand size={18} className="pr-hand" aria-label="Hand raised" /> : null}
                        {prayingNow ? (
                          <span className="pr-role is-speaking">Praying</span>
                        ) : isLeader(person.role) ? (
                          <span className="pr-role is-mod"><Crown size={13} aria-hidden /> Moderator</span>
                        ) : (
                          <span className="pr-role is-member">Participant</span>
                        )}
                        {canSpeak ? <Mic size={20} className="pr-mic-on" aria-label="Can speak" /> : <MicOff size={20} className="pr-mic-off" aria-label="Muted" />}
                      </li>
                    );
                  })}
                  {!peopleShown.length ? (
                    <li className="py-4 text-center text-sm text-[#4a5a52]">{people.length ? 'No one matches that name.' : 'People appear here as they join.'}</li>
                  ) : null}
                </ul>
              </section>

              <div data-tour="listener-chat" data-theme="light">
                {chatOn ? <PrayerChatPanel sessionId={liveSession?.id || loadJoinSession()?.sessionId} senderName={participantName} compact /> : null}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div data-theme="light">
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
      {guidelinesOpen ? <PrayerGuidelinesSheet onClose={() => setGuidelinesOpen(false)} /> : null}
    </div>
  );
};
