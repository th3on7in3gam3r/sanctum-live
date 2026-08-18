import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PrayerSessionStatus } from '../components/common/PrayerSessionStatus';
import { ParticipantCount } from '../components/common/ParticipantCount';
import { PrayerTimer } from '../components/common/PrayerTimer';
import { SpeakerCard } from '../components/dashboard/SpeakerCard';
import { RaisedHandRow } from '../components/dashboard/RaisedHandRow';
import { ParticipantRow } from '../components/dashboard/ParticipantRow';
import { PrayerCountdownTimer } from '../components/dashboard/PrayerCountdownTimer';
import { BackButton } from '../components/common/BackButton';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { DevelopmentPreviewBadge } from '../components/common/DevelopmentPreviewBadge';
import { RealtimeEngineStatus } from '../components/common/RealtimeEngineStatus';
import { TestPrayerRoomModal } from '../components/dashboard/TestPrayerRoomModal';
import { PrePrayerCheckModal } from '../components/dashboard/PrePrayerCheckModal';
import { resolveAltarLink } from '../services/altarLinkResolver';
import {
  Sliders,
  Hand,
  Mic,
  Users,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Role } from '../types';

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
    addToast,
    confirmAction,
  } = useApp();

  const { organization } = useAuth();
  const room = (prayerRooms || []).find((r) => r?.id === roomId) || (prayerRooms || [])[0];

  const resolution = resolveAltarLink(room, liveSession, historySessions);
  const isLive = resolution.status === 'LIVE';

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'PARTICIPANTS' | 'REQUESTS'>('CONSOLE');
  const [showTestRoomModal, setShowTestRoomModal] = useState(false);
  const [showPrePrayerModal, setShowPrePrayerModal] = useState(false);

  // Filter participants
  const speakers = (participants || []).filter((p) => p && (p.role === 'SPEAKER' || p.role === 'PRAYER_LEADER'));
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
  const totalCount = isLive ? (liveSession?.totalParticipants ?? participants.length) : undefined;

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

  const handleStartFromPrePrayer = () => {
    startPrayerSession(room.id);
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

        <span className="text-xs font-bold text-[#C9A35A] uppercase tracking-wider hidden sm:block">
          Altar Control Room™
        </span>
      </div>

      {/* Top Session Status Bar */}
      <div className="bg-white dark:bg-[#17221D] p-5 sm:p-6 rounded-3xl border border-[#E5E6E1] dark:border-[#26362F] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <PrayerSessionStatus status={resolution.status} size="md" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
              {room?.name || 'Prayer Altar'}
            </h1>
          </div>
          <p className="text-xs text-[#68736D] dark:text-[#96A39D] mt-0.5">
            {organization.name} • Permanent URL: <span className="font-mono text-[#203C32] dark:text-[#C9A35A]">sanctum.live/join/{room?.slug}</span>
          </p>
        </div>

        {/* Live Counters & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap self-end lg:self-auto">
          {isLive ? (
            <>
              <ParticipantCount count={totalCount} size="sm" emptyLabel="Waiting for participants" />
              <PrayerTimer seconds={sessionDuration} size="sm" />
            </>
          ) : (
            <div className="flex items-center gap-2">
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
            </div>
          )}

          <button
            onClick={() => onNavigate(`/join/${room?.slug}`)}
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
              className="px-4 py-2 rounded-xl font-bold text-xs bg-[#B94A48] hover:bg-red-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              End Prayer Session
            </button>
          )}
        </div>
      </div>

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
          <span>Prayer Requests ({prayerRequests.length})</span>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Live Speakers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#16251F] dark:text-[#F8F7F3] flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-[#C9A35A]" />
                  <span>Configured Speakers ({speakers.length})</span>
                </h3>
                <DevelopmentPreviewBadge />
                <RealtimeEngineStatus />
              </div>

              <div className="space-y-3">
                {speakers.map((speaker) => (
                  <SpeakerCard
                    key={speaker.id}
                    speaker={speaker}
                    onMute={(id) => (speaker.isMuted ? unmuteParticipant(id) : muteParticipant(id))}
                    onEndSpeaker={(id) => endSpeaker(id)}
                  />
                ))}

                {speakers.length === 0 && (
                  <div className="p-8 text-center bg-white dark:bg-[#17221D] rounded-2xl border border-[#E5E6E1] dark:border-[#26362F] text-xs text-[#68736D] dark:text-[#96A39D]">
                    No active speakers. Invite an attendee from the queue.
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Raised Hands Queue */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#16251F] dark:text-[#F8F7F3] flex items-center gap-1.5">
                  <Hand className="w-4 h-4 text-[#C9A35A]" />
                  <span>Raised Hands Queue ({raisedHands.length})</span>
                </h3>
                <span className="text-[11px] text-[#68736D] dark:text-[#96A39D]">
                  First In, First Out
                </span>
              </div>

              <div className="space-y-3">
                {raisedHands.map((hand) => (
                  <RaisedHandRow
                    key={hand.id}
                    hand={hand}
                    onInvite={(pId) => inviteSpeaker(pId)}
                    onDismiss={(hId) => dismissRaisedHand(hId)}
                  />
                ))}

                {raisedHands.length === 0 && (
                  <div className="p-8 text-center bg-white dark:bg-[#17221D] rounded-2xl border border-[#E5E6E1] dark:border-[#26362F] text-xs text-[#68736D] dark:text-[#96A39D]">
                    No raised hands in queue.
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Live Prayer Requests Stream */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#16251F] dark:text-[#F8F7F3] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#C9A35A]" />
                  <span>Incoming Requests ({prayerRequests.length})</span>
                </h3>
                <button
                  onClick={() => onNavigate('/dashboard/prayer-requests')}
                  className="text-xs text-[#203C32] dark:text-[#C9A35A] font-bold hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3 max-h-[480px] overflow-y-auto">
                {prayerRequests.slice(0, 6).map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#17221D] border border-[#E5E6E1] dark:border-[#26362F] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#16251F] dark:text-[#F8F7F3]">
                        {req.participantName}
                      </span>
                      {req.isPrivate && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                          Pastoral Only
                        </span>
                      )}
                    </div>
                    <p className="text-[#68736D] dark:text-[#96A39D] leading-relaxed italic">
                      "{req.request}"
                    </p>
                  </div>
                ))}

                {prayerRequests.length === 0 && (
                  <div className="p-8 text-center bg-white dark:bg-[#17221D] rounded-2xl border border-[#E5E6E1] dark:border-[#26362F] text-xs text-[#68736D] dark:text-[#96A39D]">
                    No incoming prayer requests yet.
                  </div>
                )}
              </div>
            </div>
          </div>
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
            {prayerRequests.map((req) => (
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
    </div>
  );
};
