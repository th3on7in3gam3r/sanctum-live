import React, { useState } from 'react';
import { SanctumLogo } from '../common/SanctumLogo';
import { LiveBadge } from '../common/LiveBadge';
import { ConnectionStatus } from '../common/ConnectionStatus';
import { ParticipantCount } from '../common/ParticipantCount';
import { PrayerTimer } from '../common/PrayerTimer';
import { AudioVisualizerPlaceholder } from '../common/AudioVisualizerPlaceholder';
import { ListenerReactionBar } from './ListenerReactionBar';
import { PrayerRequestModal } from './PrayerRequestModal';
import { InvitedSpeakerBanner } from './InvitedSpeakerBanner';
import { SpeakerLiveView } from './SpeakerLiveView';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Sun, Moon } from 'lucide-react';
import { Role } from '../../types';
import { sessionApiAdapter } from '../../services/domain/sessionApiAdapter';
import { DevelopmentPreviewBadge } from '../common/DevelopmentPreviewBadge';
import { RealtimeEngineStatus } from '../common/RealtimeEngineStatus';

interface ListenerRoomViewProps {
  participantName: string;
  roomSlug: string;
  onLeave: () => void;
}

export const ListenerRoomView: React.FC<ListenerRoomViewProps> = ({
  participantName,
  roomSlug: _roomSlug,
  onLeave,
}) => {
  const {
    liveSession,
    raiseHandAttendee,
    lowerHandAttendee,
    sendReactionAttendee,
    isDarkMode,
    toggleDarkMode,
    addToast,
  } = useApp();
  const { organization } = useAuth();

  const [currentRole, setCurrentRole] = useState<Role>('LISTENER');
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isPrayerRequestOpen, setIsPrayerRequestOpen] = useState(false);
  const [isSpeakerInvitationOpen, setIsSpeakerInvitationOpen] = useState(false);
  const [participantId] = useState(() => `part_${Date.now()}`);
  const prayerHasStarted = liveSession?.status === 'LIVE';

  const handleToggleRaiseHand = async () => {
    if (isHandRaised) {
      await lowerHandAttendee(participantId);
      setIsHandRaised(false);
    } else {
      await raiseHandAttendee(participantId, participantName);
      setIsHandRaised(true);
    }
  };

  const handleAcceptSpeakerInvitation = async () => {
    setIsSpeakerInvitationOpen(false);
    setCurrentRole('SPEAKER');
    const result = await sessionApiAdapter.grantSpeaker(liveSession?.id, participantId, {});
    if (!result.ok) {
      addToast(result.reason || 'Realtime Engine: Not configured', 'warning');
    } else {
      addToast("You're now live! Lead the church in prayer.", 'success');
    }
  };

  const handleDeclineSpeakerInvitation = () => {
    setIsSpeakerInvitationOpen(false);
    addToast('Declined speaker invitation', 'info');
  };

  const handleFinishPrayer = async () => {
    setCurrentRole('LISTENER');
    const result = await sessionApiAdapter.revokeSpeaker(liveSession?.id, participantId, {});
    if (!result.ok) {
      addToast(result.reason || 'Realtime Engine: Not configured', 'warning');
    }
    addToast('Returned to listener mode. Thank you for praying!', 'info');
  };

  const participantCount = liveSession?.totalParticipants;
  const activeSpeaker = liveSession?.activeSpeakerName || 'Waiting for the speaker floor';
  const activeSpeakerTitle = liveSession?.activeSpeakerTitle || 'No speaker is live yet';
  const elapsedSeconds = liveSession?.durationSeconds || 0;

  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] flex flex-col justify-between p-4 sm:p-6 transition-colors select-none">
      {/* Top Navigation & Status Bar */}
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between pb-4 border-b border-[#E5E6E1] dark:border-[#26362F]">
        <div className="flex items-center gap-3">
          <SanctumLogo size="sm" />
          <div className="hidden sm:block text-xs font-semibold text-[#68736D] dark:text-[#96A39D]">
            {organization.name}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ConnectionStatus status="OFFLINE" showLabel={false} preview />
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

      {/* Main Room Body */}
      <main className="w-full max-w-2xl mx-auto my-auto py-4 sm:py-6 space-y-6">
        {/* Session Meta Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-left bg-white/60 dark:bg-[#17221D]/60 p-4 rounded-2xl border border-[#E5E6E1] dark:border-[#26362F]">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              {prayerHasStarted ? <LiveBadge size="sm" /> : null}
              <h1 className="text-lg sm:text-xl font-bold text-[#16251F] dark:text-[#F8F7F3]">
                {liveSession?.roomName || 'Morning Prayer'}
              </h1>
            </div>
            <p className="text-xs text-[#68736D] dark:text-[#96A39D]">
              {prayerHasStarted
                ? <>Praying with: <span className="font-semibold text-[#16251F] dark:text-[#F8F7F3]">{participantName}</span> (Listener)</>
                : 'Prayer has not started'}
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3 flex-wrap">
            <ParticipantCount count={participantCount} suffix="praying with you" size="sm" emptyLabel="Waiting for participants" />
            <PrayerTimer seconds={elapsedSeconds} size="sm" />
          </div>
        </div>

        {/* Dynamic Centerpiece: Invited Speaker Live Mode vs Calm Audio Visualizer */}
        {currentRole === 'SPEAKER' ? (
          <SpeakerLiveView
            participantName={participantName}
            participantCount={participantCount}
            onFinishPrayer={handleFinishPrayer}
          />
        ) : (
          <AudioVisualizerPlaceholder
            speakerName={activeSpeaker}
            speakerTitle={activeSpeakerTitle}
            isLive={prayerHasStarted}
          />
        )}

        {/* Listener Reactions & Actions (Only for listeners) */}
        {currentRole === 'LISTENER' && (
          <ListenerReactionBar
            isHandRaised={isHandRaised}
            onSendAmen={() => sendReactionAttendee('AMEN')}
            onSendPraiseGod={() => sendReactionAttendee('PRAISE_GOD')}
            onToggleRaiseHand={handleToggleRaiseHand}
            onOpenPrayerRequest={() => setIsPrayerRequestOpen(true)}
          />
        )}
      </main>

      {/* Simplified Attendee Footer */}
      <footer className="w-full max-w-2xl mx-auto pt-4 text-center text-xs text-[#68736D] dark:text-[#96A39D] flex items-center justify-between border-t border-[#E5E6E1] dark:border-[#26362F]">
        <span className="text-[11px]">Sanctum Live™ — Prayer without barriers</span>
        <span className="text-[11px] inline-flex items-center gap-2">
          <RealtimeEngineStatus />
          <DevelopmentPreviewBadge />
        </span>
      </footer>

      {/* Prayer Request Modal */}
      <PrayerRequestModal
        isOpen={isPrayerRequestOpen}
        onClose={() => setIsPrayerRequestOpen(false)}
        defaultName={participantName}
        roomName={liveSession?.roomName}
      />

      {/* Pastor Invitation Banner */}
      <InvitedSpeakerBanner
        isOpen={isSpeakerInvitationOpen}
        onAccept={handleAcceptSpeakerInvitation}
        onDecline={handleDeclineSpeakerInvitation}
      />
    </div>
  );
};
