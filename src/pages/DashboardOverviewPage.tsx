import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { OverviewMetrics } from '../components/dashboard/OverviewMetrics';
import { NextSessionCard } from '../components/dashboard/NextSessionCard';
import { RecentSessionsTable } from '../components/dashboard/RecentSessionsTable';
import { TestPrayerRoomModal } from '../components/dashboard/TestPrayerRoomModal';
import { PrePrayerCheckModal } from '../components/dashboard/PrePrayerCheckModal';
import { Plus, Sliders } from 'lucide-react';

interface DashboardOverviewPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardOverviewPage: React.FC<DashboardOverviewPageProps> = ({
  onNavigate,
}) => {
  const { user, organization } = useAuth();
  const { prayerRooms = [], historySessions = [], liveSession, prayerRequests = [], startPrayerSession } = useApp();

  const [showTestRoomModal, setShowTestRoomModal] = useState(false);
  const [showPrePrayerModal, setShowPrePrayerModal] = useState(false);

  const activeRooms = (prayerRooms || []).filter((room) => !room.isArchived);
  const nextRoom = activeRooms[0] || {
    id: 'room_1',
    name: 'Morning Prayer',
    slug: 'morning-prayer',
    expectedAttendance: 2000,
    status: 'SCHEDULED',
    isRecurring: true,
    scheduledStart: '05:00 AM',
    timezone: 'EAT (UTC+3)',
    recordingEnabled: false,
    dataSaverEnabled: true,
  };

  const completedSessions = (historySessions || []).filter((s) => s?.status === 'ENDED' || s?.status === 'COMPLETED');
  const activeRequestsCount = (prayerRequests || []).filter((r) => r?.status === 'PENDING').length;

  const totalUniquePeopleReached = completedSessions.reduce(
    (acc, s) => acc + (s.totalUniqueParticipants || s.totalParticipants || 0),
    0
  );

  const totalDurationSeconds = completedSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const hours = totalDurationSeconds / 3600;
  const totalPrayerHours = Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(/\.0$/, '');

  const handleStartFromPrePrayer = () => {
    startPrayerSession(nextRoom.id);
    onNavigate(`/dashboard/prayer-rooms/${nextRoom.id}/control`);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
            Good morning, {user?.name?.split(' ')[0] || 'Pastor'}
          </h1>
          <p className="text-xs sm:text-sm text-[#68736D] dark:text-[#96A39D] mt-1">
            Here's what's happening in your Sanctum Space at <strong className="text-[#203C32] dark:text-[#C9A35A]">{organization?.name || 'Sanctum Space'}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowTestRoomModal(true)}
            type="button"
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs border border-[#203C32]/30 dark:border-[#C9A35A]/40 bg-[#203C32]/5 dark:bg-[#C9A35A]/10 text-[#203C32] dark:text-[#E8D8B2] hover:bg-[#203C32]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Test Room</span>
          </button>

          <button
            onClick={() => onNavigate('/dashboard/prayer-rooms/new')}
            type="button"
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Prayer Room</span>
          </button>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <OverviewMetrics
        totalRooms={activeRooms.length}
        activeRequests={activeRequestsCount}
        peopleReached={totalUniquePeopleReached}
        totalPrayerHours={totalPrayerHours}
      />

      {/* Prominent Next Session / Active Live Altar Card */}
      <NextSessionCard
        room={nextRoom as any}
        liveSession={liveSession}
        onOpenControlRoom={(roomId) => onNavigate(`/dashboard/prayer-rooms/${roomId}/control`)}
        onOpenPublicJoin={(slug) => onNavigate(`/join/${slug}`)}
        onEditRoom={(roomId) => onNavigate(`/dashboard/prayer-rooms/${roomId}/edit`)}
        onOpenTestRoom={() => setShowTestRoomModal(true)}
        onOpenPrePrayerCheck={() => setShowPrePrayerModal(true)}
      />

      {/* Recent Sessions Table */}
      <RecentSessionsTable
        sessions={completedSessions}
        onViewSessionDetails={() => onNavigate(`/dashboard/history`)}
      />

      {/* Modals */}
      <TestPrayerRoomModal
        isOpen={showTestRoomModal}
        onClose={() => setShowTestRoomModal(false)}
        roomName={nextRoom.name}
      />

      <PrePrayerCheckModal
        isOpen={showPrePrayerModal}
        onClose={() => setShowPrePrayerModal(false)}
        room={nextRoom as any}
        session={liveSession}
        waitingCount={liveSession?.status === 'WAITING' ? (liveSession.listenersWaitingCount || 0) : 0}
        onStartPrayer={handleStartFromPrePrayer}
      />
    </div>
  );
};
