import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PrayerSessionStatus } from '../components/common/PrayerSessionStatus';
import { ParticipantCount } from '../components/common/ParticipantCount';
import { PrayerTimer } from '../components/common/PrayerTimer';
import { SpeakerCard } from '../components/dashboard/SpeakerCard';
import { RaisedHandRow } from '../components/dashboard/RaisedHandRow';
import { CongregationRoster } from '../components/dashboard/CongregationRoster';
import { ParticipantRow } from '../components/dashboard/ParticipantRow';
import { PrayerCountdownTimer } from '../components/dashboard/PrayerCountdownTimer';
import { BackButton } from '../components/common/BackButton';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { DevelopmentPreviewBadge } from '../components/common/DevelopmentPreviewBadge';
import { RealtimeEngineStatus } from '../components/common/RealtimeEngineStatus';
import { LocalMicStatus } from '../components/common/LocalMicStatus';
import { TestPrayerRoomModal } from '../components/dashboard/TestPrayerRoomModal';
import { PrePrayerCheckModal } from '../components/dashboard/PrePrayerCheckModal';
import { OpenSanctuaryModal } from '../components/dashboard/OpenSanctuaryModal';
import { PrayerChatPanel } from '../components/public/PrayerChatPanel';
import { resolveAltarLink } from '../services/altarLinkResolver';
import {
  Sliders,
  Hand,
  Mic,
  MicOff,
  Users,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  MessageCircle,
  VolumeX,
  CircleHelp,
  Volume2,
} from 'lucide-react';
import { Role } from '../types';
import { canMuteCongregation, canModerate, hasPermission } from '../lib/permissions';
import { livekitRealtimeProvider } from '../services/realtime/livekitRealtimeProvider';
import { useTour } from '../hooks/useTour';
import { TOUR_IDS } from '../tour/tourIds';
import { controlRoomTourSteps } from '../tour/controlRoomTour';

interface PrayerControlRoomPageProps {
  roomId: string;
  onNavigate: (path: string) => void;
}

export const PrayerControlRoomPage: React.FC<PrayerControlRoomPageProps> = ({
  roomId,
  onNavigate,
}) => {
  const {
    prayerRooms = [],
    liveSession,
    historySessions = [],
    participants = [],
    raisedHands = [],
    prayerRequests = [],
    inviteSpeaker,
    endSpeaker,
    muteParticipant,
    unmuteParticipant,
    assignRole,
    removeParticipant,
    dismissRaisedHand,
    endLiveSession,
    startPrayerSession,
    openSanctuary,
    addToast,
    confirmAction,
    connectedNow,
    connectionState,
    connectControlRoom,
    setCongregationMuted,
    startPrivatePrayer,
    endPrivatePrayer,
  } = useApp();

  const { organization, user } = useAuth();
  const canControlCongregation =
    user?.role === 'OWNER' || user?.role === 'ADMIN' ? canMuteCongregation(user.role) : false;
  const congregationMuted = liveSession?.congregationMuted !== false;
  const discussionOpen = !congregationMuted;
  const canMuteIndividuals = user?.role ? canModerate(user.role) : false;
  const room = (prayerRooms || []).find((r) => r?.id === roomId) || (prayerRooms || [])[0];
  const sermonLeaderName = liveSession?.sermonLeaderName?.trim() || '';
  const isSermonLeader =
    Boolean(sermonLeaderName && user?.name) &&
    sermonLeaderName.toLocaleLowerCase() === user?.name?.trim().toLocaleLowerCase();
  const visiblePrayerRequests = (prayerRequests || []).filter(
    (req) => !req.isPrivate || hasPermission(user?.role || 'LISTENER', 'canViewPrivateRequests')
  );
  const raisedHandIds = new Set((raisedHands || []).map((hand) => hand.participantId));
  const prayerRequestIds = new Set(
    visiblePrayerRequests
      .filter((req) => req.status === 'PENDING' || req.status === 'ANSWERED')
      .map((req) => req.participantId)
      .filter((id): id is string => Boolean(id))
  );
  const privateHoldRef = React.useRef(false);

  const resolution = resolveAltarLink(room, liveSession, historySessions);
  const isLive = resolution.status === 'LIVE';

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'PARTICIPANTS' | 'REQUESTS' | 'CHAT'>('CONSOLE');
  const [showTestRoomModal, setShowTestRoomModal] = useState(false);
  const [showPrePrayerModal, setShowPrePrayerModal] = useState(false);
  const [showOpenSanctuaryModal, setShowOpenSanctuaryModal] = useState(false);
  const [hostMicOn, setHostMicOn] = useState(false);
  const [hostMicBusy, setHostMicBusy] = useState(false);
  const [micOnByIdentity, setMicOnByIdentity] = useState<Record<string, boolean>>({});
  const { startTour } = useTour(TOUR_IDS.controlRoom, controlRoomTourSteps, { delayMs: 800 });

  // Filter participants
  const speakers = (participants || []).filter((p) => p && p.role === 'SPEAKER');
  const filteredParticipants = (participants || []).filter((p) => {
    if (!p) return false;
    const matchesSearch =
      (p.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.country && p.country.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (roleFilter !== 'ALL') return p.role === roleFilter;
    return true;
  });

  const sessionDuration = liveSession?.durationSeconds || 0;
  const liveConnected = connectionState === 'CONNECTED';
  const totalCount = isLive || resolution.status === 'WAITING' ? connectedNow || undefined : undefined;

  useEffect(() => {
    if (!room?.id) return;
    void connectControlRoom(room.id);
    if (resolution.status === 'SCHEDULED' || resolution.status === 'ENDED') {
      const timer = window.setInterval(() => {
        void connectControlRoom(room.id);
      }, 1500);
      return () => window.clearInterval(timer);
    }
  }, [room?.id, liveSession?.id, resolution.status]);

  useEffect(() => {
    const syncMics = () => {
      const states = livekitRealtimeProvider.getMicStates();
      setMicOnByIdentity(states);
      const identity = livekitRealtimeProvider.getIdentity();
      if (identity) {
        setHostMicOn(Boolean(states[identity]));
      }
    };
    syncMics();
    const unsubscribe = livekitRealtimeProvider.subscribe(syncMics);
    const timer = window.setInterval(syncMics, 1000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [liveConnected, connectionState]);

  const handleEndSessionClick = () => {
    confirmAction({
      title: 'End Live Prayer Gathering?',
      description:
        'This will conclude the active corporate prayer session for everyone in the room, safely disconnect all attendee audio streams, and archive attendance stats.',
      confirmText: 'Yes, End Session',
      cancelText: 'Continue Praying',
      isDestructive: true,
      onConfirm: async () => {
        if (liveSession) {
          await endLiveSession(liveSession.id);
        }
        addToast('Prayer session concluded successfully. God bless your ministry!', 'success');
        onNavigate('/dashboard');
      },
    });
  };

  const handleStartFromPrePrayer = (sermonLeaderName: string) => {
    void startPrayerSession(room.id, sermonLeaderName);
  };

  const handleToggleHostMic = async () => {
    setHostMicBusy(true);
    try {
      if (!liveConnected && room?.id) {
        await connectControlRoom(room.id);
      }
      if (hostMicOn) {
        await livekitRealtimeProvider.disableMicrophone();
        setHostMicOn(false);
        addToast('Microphone muted', 'info');
        return;
      }
      await livekitRealtimeProvider.enableMicrophone();
      setHostMicOn(true);
      addToast('Your microphone is on. The congregation can hear you lead.', 'success');
    } catch (error) {
      addToast(
        error instanceof Error
          ? error.message
          : 'Allow microphone access in the browser to lead in prayer.',
        'error'
      );
    } finally {
      setHostMicBusy(false);
    }
  };

  const breadcrumbs = [
    { label: 'Prayer Rooms', path: '/dashboard/prayer-rooms' },
    { label: room?.name || 'Altar Room', path: `/dashboard/prayer-rooms/${room?.id || roomId}` },
    { label: 'Control Room', isCurrent: true },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb and Back Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton
            to={`/dashboard/prayer-rooms/${room?.id || roomId}`}
            label="Back to Prayer Room"
            mobileLabel="Back"
            onNavigate={onNavigate}
          />
          <Breadcrumbs items={breadcrumbs} onNavigate={onNavigate} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startTour()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] text-xs font-semibold text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            aria-label="Show Control Room tutorial"
          >
            <CircleHelp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Help</span>
          </button>
          <span className="text-xs font-bold text-[#C9A35A] uppercase tracking-wider hidden sm:block">
            Altar Control Room™
          </span>
        </div>
      </div>

      {/* Top Session Status Bar */}
      <div
        className="bg-white dark:bg-[#17221D] p-5 sm:p-6 rounded-3xl border border-[#E5E6E1] dark:border-[#26362F] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        data-tour="control-welcome"
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <PrayerSessionStatus status={resolution.status} size="md" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
              {room?.name || 'Prayer Altar'}
            </h1>
          </div>
          <p className="text-xs text-[#68736D] dark:text-[#96A39D] mt-0.5">
            {organization.name} • Lead from this Control Room. Congregants join as listeners at{' '}
            <span className="font-mono text-[#203C32] dark:text-[#C9A35A]">/join/{room?.slug}</span>
          </p>
          {sermonLeaderName && (
            <p className="mt-2 text-xs font-semibold text-[#203C32] dark:text-[#E8D8B2]">
              Sermon leader: {sermonLeaderName}
            </p>
          )}
          {user?.role === 'ADMIN' ? (
            <p className="mt-2 inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              You are operating this room as Admin. Moderate here while the named sermon leader speaks.
            </p>
          ) : isSermonLeader ? (
            <p className="mt-2 inline-flex rounded-full bg-[#C9A35A]/15 px-2.5 py-1 text-[11px] font-bold text-[#203C32] dark:text-[#E8D8B2]">
              You are leading as Sermon leader.
            </p>
          ) : null}
        </div>

        {/* Live Counters & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap self-end lg:self-auto">
          {isLive ? (
            <>
              <ParticipantCount count={totalCount} size="sm" emptyLabel="Connected now: waiting" />
              <PrayerTimer seconds={sessionDuration} size="sm" />
            </>
          ) : (
            <div className="flex items-center gap-2" data-tour="control-start">
              <button
                onClick={() => setShowTestRoomModal(true)}
                type="button"
                className="px-3 py-2 rounded-xl border border-[#203C32]/30 dark:border-[#C9A35A]/40 bg-[#203C32]/5 dark:bg-[#C9A35A]/10 text-xs font-bold text-[#203C32] dark:text-[#E8D8B2] hover:bg-[#203C32]/10 flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Test Room</span>
              </button>

              <button
                onClick={() => setShowPrePrayerModal(true)}
                type="button"
                className="px-3.5 py-2 rounded-xl font-bold text-xs bg-[#203C32] hover:bg-[#16251F] text-white dark:bg-[#C9A35A] dark:text-[#101814] shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Pre-Prayer Check™</span>
              </button>

              {resolution.status === 'WAITING' && (
                <button
                  onClick={() => void startPrayerSession(room.id, liveSession?.sermonLeaderName || '')}
                  type="button"
                  className="px-3.5 py-2 rounded-xl font-bold text-xs bg-[#D7473F] hover:bg-[#C23C35] text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Prayer</span>
                </button>
              )}
              {(resolution.status === 'SCHEDULED' || resolution.status === 'ENDED') && (
                <button
                  onClick={() => setShowOpenSanctuaryModal(true)}
                  type="button"
                  className="px-3.5 py-2 rounded-xl font-bold text-xs bg-[#203C32] hover:bg-[#16251F] text-white dark:bg-[#C9A35A] dark:text-[#101814] shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Open sanctuary</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => {
              if (!room?.slug) return;
              window.open(`${window.location.origin}/join/${room.slug}`, '_blank', 'noopener,noreferrer');
            }}
            type="button"
            className="px-3 py-2 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] text-xs font-semibold text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Join Link</span>
          </button>

          {isLive && (
            <button
              onClick={handleEndSessionClick}
              type="button"
              data-tour="control-end"
              className="px-4 py-2 rounded-xl font-bold text-xs bg-[#B94A48] hover:bg-red-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              End Prayer Session
            </button>
          )}
        </div>
      </div>

      {(resolution.status === 'WAITING' || isLive) && (
        <div
          className="bg-white dark:bg-[#17221D] p-4 sm:p-5 rounded-3xl border border-[#E5E6E1] dark:border-[#26362F] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          data-tour="control-host-mic"
        >
          <div>
            <p className="text-sm font-bold text-[#16251F] dark:text-[#F8F7F3] flex items-center gap-1.5">
              {hostMicOn ? <Mic className="w-4 h-4 text-emerald-600" /> : <MicOff className="w-4 h-4 text-[#68736D]" />}
              Host microphone — sermon audio
            </p>
            <p className="text-xs text-[#68736D] dark:text-[#96A39D] mt-0.5">
              {hostMicOn
                ? 'You are live. The congregation can hear you (except during a private sideline).'
                : 'The control identity that turns this on is the voice the congregation hears. The named sermon leader can lead from another Control Room.'}
            </p>
            <div className="mt-2">
              <LocalMicStatus />
            </div>
          </div>
          <button
            type="button"
            disabled={hostMicBusy}
            onClick={() => void handleToggleHostMic()}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${
              hostMicOn
                ? 'bg-[#B94A48] hover:bg-red-700 text-white'
                : 'bg-[#203C32] hover:bg-[#16251F] text-white dark:bg-[#C9A35A] dark:text-[#101814]'
            }`}
          >
            {hostMicOn ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{hostMicOn ? 'Mute microphone' : 'Turn on microphone'}</span>
          </button>
        </div>
      )}

      {(resolution.status === 'WAITING' || isLive) && canControlCongregation && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            congregationMuted
              ? 'bg-white dark:bg-[#17221D] border-[#E5E6E1] dark:border-[#26362F]'
              : 'bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-500/10 dark:border-emerald-400/30'
          }`}
          data-tour="control-congregation-mute"
        >
          <div>
            <p className="text-sm font-bold text-[#16251F] dark:text-[#F8F7F3] flex items-center gap-1.5">
              {congregationMuted ? (
                <VolumeX className="w-4 h-4 text-[#B94A48]" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              )}
              Room operator — PTT and moderation
            </p>
            <p className="text-xs text-[#68736D] dark:text-[#96A39D] mt-0.5">
              {congregationMuted
                ? 'Only you and ministers can speak. Congregants listen. Hold a name for private prayer.'
                : 'Congregants tap to speak (one at a time). Your voice still uses Host microphone above.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (congregationMuted) {
                confirmAction({
                  title: 'Open Discussion PTT?',
                  description:
                    'Congregants will be able to tap to speak, one at a time. This does not turn on your host microphone.',
                  confirmText: 'Open Discussion PTT',
                  cancelText: 'Keep Sermon mode',
                  onConfirm: () => void setCongregationMuted(false),
                });
                return;
              }
              confirmAction({
                title: 'Return to Sermon mode?',
                description:
                  'Everyone except the pastor and ministers will be muted. Use this for preaching and opening prayer.',
                confirmText: 'Sermon mode',
                cancelText: 'Keep Discussion PTT',
                isDestructive: true,
                onConfirm: () => void setCongregationMuted(true),
              });
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
              congregationMuted
                ? 'bg-[#203C32] hover:bg-[#16251F] text-white dark:bg-[#C9A35A] dark:text-[#101814]'
                : 'bg-[#B94A48] hover:bg-red-700 text-white'
            }`}
          >
            {congregationMuted ? <Mic className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{congregationMuted ? 'Open Discussion PTT' : 'Return to Sermon'}</span>
          </button>
        </div>
      )}

      {/* Control Room Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E6E1] dark:border-[#26362F] pb-2">
        <button
          onClick={() => setActiveTab('CONSOLE')}
          type="button"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'CONSOLE'
              ? 'bg-[#203C32] text-white dark:bg-[#C9A35A] dark:text-[#101814]'
              : 'text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Live Console</span>
        </button>

        <button
          onClick={() => setActiveTab('PARTICIPANTS')}
          type="button"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'PARTICIPANTS'
              ? 'bg-[#203C32] text-white dark:bg-[#C9A35A] dark:text-[#101814]'
              : 'text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Participants ({participants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS')}
          type="button"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'REQUESTS'
              ? 'bg-[#203C32] text-white dark:bg-[#C9A35A] dark:text-[#101814]'
              : 'text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Prayer Requests ({visiblePrayerRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CHAT')}
          type="button"
          data-tour="control-chat-tab"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'CHAT'
              ? 'bg-[#203C32] text-white dark:bg-[#C9A35A] dark:text-[#101814]'
              : 'text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>
      </div>

      {/* Main Console Tab (Multi-column view) */}
      {activeTab === 'CONSOLE' && (
        <div className="space-y-6">
          {/* Moderator Live Prayer Flow Countdown */}
          <PrayerCountdownTimer
            initialMinutes={5}
            activeSpeakerName={liveSession?.activeSpeakerName}
            onTimeExpired={() => addToast('Prayer segment timer expired — conclude speaker turn', 'warning')}
          />

          {(resolution.status === 'WAITING' || isLive) ? (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,300px)_minmax(300px,1fr)_minmax(260px,330px)] gap-4 items-start">
              <div data-tour="control-roster">
                <CongregationRoster
                  participants={participants}
                  micOnByIdentity={micOnByIdentity}
                  localIdentity={livekitRealtimeProvider.getIdentity()}
                  discussionOpen={discussionOpen}
                  raisedHandParticipantIds={raisedHandIds}
                  prayerRequestParticipantIds={prayerRequestIds}
                  pttParticipantId={liveSession?.pttParticipantId}
                  privatePrayerMemberId={liveSession?.privatePrayer?.memberParticipantId}
                  canPrivatePray={canControlCongregation}
                  onPrivatePrayStart={(id) => {
                    privateHoldRef.current = true;
                    void startPrivatePrayer(id);
                  }}
                  onPrivatePrayEnd={() => {
                    if (!privateHoldRef.current) return;
                    privateHoldRef.current = false;
                    void endPrivatePrayer();
                  }}
                  onMute={canMuteIndividuals ? (id) => void muteParticipant(id) : undefined}
                />
              </div>

              <div className="bg-white dark:bg-[#17221D] rounded-3xl border border-[#E5E6E1] dark:border-[#26362F] p-6 sm:p-8 min-h-[28rem] flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#68736D] dark:text-[#96A39D]">
                  {liveSession?.privatePrayer ? 'Private sideline' : congregationMuted ? 'Sermon mode' : 'Discussion PTT'}
                </p>
                {sermonLeaderName && (
                  <p className="mt-2 text-sm font-bold text-[#203C32] dark:text-[#E8D8B2]">
                    Sermon leader: {sermonLeaderName}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleToggleHostMic()}
                  disabled={hostMicBusy || !canControlCongregation}
                  aria-label={hostMicOn ? 'Mute host microphone' : 'Turn on host microphone'}
                  className={`mt-6 w-40 h-40 rounded-full flex items-center justify-center border-8 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    hostMicOn
                      ? 'bg-[#B94A48] border-[#E7B0AD] text-white shadow-[0_0_0_14px_rgba(185,74,72,0.12)]'
                      : 'bg-[#203C32] border-[#C9A35A]/60 text-[#F8F7F3] shadow-[0_0_0_14px_rgba(201,163,90,0.12)] dark:bg-[#C9A35A] dark:text-[#101814]'
                  }`}
                >
                  {hostMicOn ? <MicOff className="w-14 h-14" /> : <Mic className="w-14 h-14" />}
                </button>
                <h2 className="mt-7 text-2xl sm:text-3xl font-extrabold text-[#16251F] dark:text-[#F8F7F3]">
                  {hostMicOn ? 'You are live' : 'Ready to lead'}
                </h2>
                <p className="mt-2 max-w-sm text-sm text-[#68736D] dark:text-[#96A39D]">
                  {liveSession?.privatePrayer
                    ? 'Private prayer is active. Only you and the selected congregant can hear this exchange.'
                    : hostMicOn
                      ? 'The congregation can hear your microphone.'
                      : 'Press the microphone to let the congregation hear the sermon.'}
                </p>
                <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#68736D] dark:text-[#96A39D]">
                  <Users className="w-4 h-4" />
                  {connectedNow} connected
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3" data-tour="control-raised-hands">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#16251F] dark:text-[#F8F7F3] flex items-center gap-1.5">
                      <Hand className="w-4 h-4 text-[#C9A35A]" />
                      <span>Raised Hands ({raisedHands.length})</span>
                    </h3>
                    <span className="text-[10px] text-[#68736D] dark:text-[#96A39D]">FIFO</span>
                  </div>
                  {raisedHands.map((hand) => (
                    <RaisedHandRow
                      key={hand.id}
                      hand={hand}
                      onInviteToPray={(pId) => inviteSpeaker(pId)}
                      onDismiss={(hId) => dismissRaisedHand(hId)}
                      canInvite={isLive}
                    />
                  ))}
                  {raisedHands.length === 0 && (
                    <div className="p-6 text-center bg-white dark:bg-[#17221D] rounded-2xl border border-[#E5E6E1] dark:border-[#26362F] text-xs text-[#68736D] dark:text-[#96A39D]">
                      No raised hands in queue.
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#16251F] dark:text-[#F8F7F3] flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#C9A35A]" />
                      <span>Requests ({visiblePrayerRequests.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => onNavigate('/dashboard/prayer-requests')}
                      className="text-xs text-[#203C32] dark:text-[#C9A35A] font-bold hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {visiblePrayerRequests.slice(0, 4).map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-2xl bg-white dark:bg-[#17221D] border border-[#E5E6E1] dark:border-[#26362F] text-xs"
                      >
                        <p className="font-bold text-[#16251F] dark:text-[#F8F7F3]">{req.participantName}</p>
                        <p className="mt-1 text-[#68736D] dark:text-[#96A39D] italic">"{req.request}"</p>
                      </div>
                    ))}
                    {visiblePrayerRequests.length === 0 && (
                      <div className="p-6 text-center bg-white dark:bg-[#17221D] rounded-2xl border border-[#E5E6E1] dark:border-[#26362F] text-xs text-[#68736D] dark:text-[#96A39D]">
                        No incoming prayer requests.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center bg-white dark:bg-[#17221D] rounded-3xl border border-[#E5E6E1] dark:border-[#26362F]">
              <h2 className="text-xl font-extrabold text-[#16251F] dark:text-[#F8F7F3]">Open the sanctuary to go live</h2>
              <p className="mt-2 text-sm text-[#68736D] dark:text-[#96A39D]">
                Once the room is open, this console will show the live roster, large host microphone, raised hands, and requests.
              </p>
            </div>
          )}

          {speakers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#16251F] dark:text-[#F8F7F3] flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-[#C9A35A]" />
                  <span>Formal Prayer Speakers ({speakers.length})</span>
                </h3>
                {liveConnected ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Media Engine Connected
                  </span>
                ) : (
                  <DevelopmentPreviewBadge />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {speakers.map((speaker) => (
                  <SpeakerCard
                    key={speaker.id}
                    speaker={speaker}
                    onMute={(id) => (speaker.isMuted ? unmuteParticipant(id) : muteParticipant(id))}
                    onEndSpeaker={(id) => endSpeaker(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === 'PARTICIPANTS' && (
        <div className="bg-white dark:bg-[#17221D] rounded-3xl border border-[#E5E6E1] dark:border-[#26362F] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search attendees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3] dark:bg-[#101814] text-[#16251F] dark:text-[#F8F7F3] focus:outline-none focus:border-[#203C32] dark:focus:border-[#C9A35A]"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                aria-label="Filter attendees by role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-white dark:bg-[#17221D] text-[#16251F] dark:text-[#F8F7F3] focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="LISTENER">Listeners</option>
                <option value="SPEAKER">Speakers</option>
                <option value="PRAYER_LEADER">Prayer Leaders</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-[#E5E6E1] dark:divide-[#26362F]">
            {filteredParticipants.map((p) => (
              <ParticipantRow
                key={p.id}
                participant={p}
                onInviteToSpeak={(id) => inviteSpeaker(id)}
                onMute={(id) => (p.isMuted ? unmuteParticipant(id) : muteParticipant(id))}
                onMakePrayerLeader={(id) => assignRole(id, 'PRAYER_LEADER')}
                onReturnToListener={(id) => assignRole(id, 'LISTENER')}
                onRemove={(id) => removeParticipant(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Prayer Requests Tab */}
      {activeTab === 'REQUESTS' && (
        <div className="bg-white dark:bg-[#17221D] rounded-3xl border border-[#E5E6E1] dark:border-[#26362F] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#16251F] dark:text-[#F8F7F3]">
              Active Prayer Requests & Petitions
            </h3>
            <button
              onClick={() => onNavigate('/dashboard/prayer-requests')}
              className="text-xs text-[#203C32] dark:text-[#C9A35A] font-bold hover:underline cursor-pointer"
            >
              Open Full Requests Manager →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visiblePrayerRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-[#F8F7F3] dark:bg-[#101814] border border-[#E5E6E1] dark:border-[#26362F] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#16251F] dark:text-[#F8F7F3]">
                    {req.participantName}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[#68736D] dark:text-[#96A39D] leading-relaxed">
                  "{req.request}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'CHAT' && (
        <PrayerChatPanel sessionId={liveSession?.id} senderName={user?.name || 'Prayer Leader'} />
      )}

      <div className="pt-2 flex items-center justify-end">
        <RealtimeEngineStatus />
      </div>

      {/* Modals */}
      <TestPrayerRoomModal
        isOpen={showTestRoomModal}
        onClose={() => setShowTestRoomModal(false)}
        roomName={room?.name || 'Morning Prayer'}
      />

      <PrePrayerCheckModal
        isOpen={showPrePrayerModal}
        onClose={() => setShowPrePrayerModal(false)}
        room={room}
        session={liveSession}
        waitingCount={liveSession?.status === 'WAITING' ? (liveSession.listenersWaitingCount || participants.length || 0) : 0}
        onStartPrayer={handleStartFromPrePrayer}
      />
      <OpenSanctuaryModal
        isOpen={showOpenSanctuaryModal}
        roomName={room?.name || 'Prayer Altar'}
        onClose={() => setShowOpenSanctuaryModal(false)}
        onSubmit={(sermonLeaderName) => {
          setShowOpenSanctuaryModal(false);
          void openSanctuary(room.id, sermonLeaderName);
        }}
      />
    </div>
  );
};
