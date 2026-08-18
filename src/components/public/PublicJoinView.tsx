import React, { useState } from 'react';
import { SanctumLogo } from '../common/SanctumLogo';
import { ParticipantCount } from '../common/ParticipantCount';
import { PrayerSessionStatus } from '../common/PrayerSessionStatus';
import { PrayerCountdown } from '../common/PrayerCountdown';
import { SanctuaryWaitingView } from './SanctuaryWaitingView';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { resolveAltarLink } from '../../services/altarLinkResolver';
import { ShieldCheck, HelpCircle, Sparkles, Moon, Sun, Calendar, Clock } from 'lucide-react';

interface PublicJoinViewProps {
  slug: string;
  onJoinSuccess: (participantName: string) => void;
}

export const PublicJoinView: React.FC<PublicJoinViewProps> = ({ slug, onJoinSuccess }) => {
  const { prayerRooms, liveSession, historySessions, dataSaverMode, setDataSaverMode, isDarkMode, toggleDarkMode, joinPrayerRoom } = useApp();
  const { organization } = useAuth();
  
  const [name, setName] = useState(() => {
    return localStorage.getItem('sanctum_last_attendee_name') || '';
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [inWaitingRoom, setInWaitingRoom] = useState(false);

  // Find room by slug
  const room = prayerRooms.find((r) => r.slug === slug) || prayerRooms[0];
  const resolution = resolveAltarLink(room, liveSession, historySessions);

  const isLive = resolution.status === 'LIVE';
  const isWaiting = resolution.status === 'WAITING';
  const attendeeCount = isLive ? liveSession?.totalParticipants : undefined;

  // If attendee entered waiting room and session is in WAITING state
  if (inWaitingRoom && isWaiting) {
    return (
      <SanctuaryWaitingView
        room={room}
        session={resolution.activeSession}
        participantName={name || 'Member'}
        onSessionLive={() => {
          onJoinSuccess(name.trim() || 'Member');
        }}
        onBack={() => setInWaitingRoom(false)}
      />
    );
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name to join');
      return;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      localStorage.setItem('sanctum_last_attendee_name', name.trim());
      await joinPrayerRoom(room.slug, name.trim());
      
      if (isWaiting) {
        setInWaitingRoom(true);
      } else {
        onJoinSuccess(name.trim());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] flex flex-col justify-between p-4 sm:p-6 select-none transition-colors">
      {/* Top Header bar with Logo & Theme toggle */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-2 pb-4">
        <SanctumLogo size="md" showTagline />
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          className="p-2 rounded-xl text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-[#C9A35A]" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Sanctuary Join Card */}
      <main className="w-full max-w-md mx-auto my-auto bg-white dark:bg-[#17221D] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E5E6E1] dark:border-[#26362F] text-center">
        {/* Status Pill & Attendee Count */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-5">
          <PrayerSessionStatus status={resolution.status} size="md" />
          <ParticipantCount
            count={attendeeCount}
            emptyLabel={isLive ? 'Waiting for participants' : 'Prayer has not started'}
          />
        </div>

        {/* Room & Church Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
          {room?.name || 'Morning Prayer'}
        </h1>
        
        <p className="text-sm font-semibold text-[#203C32] dark:text-[#C9A35A] mt-1">
          {organization.name}
        </p>

        <p className="text-xs text-[#68736D] dark:text-[#96A39D] mt-0.5">
          {todayFormatted} • {room?.scheduledStart || '05:00 AM'} ({room?.timezone || 'EAT'})
        </p>

        {/* Scheduled Countdown Box if not LIVE */}
        {!isLive && !isWaiting && resolution.nextScheduledDate && (
          <div className="my-5 p-4 rounded-2xl bg-[#203C32]/5 dark:bg-[#C9A35A]/10 border border-[#203C32]/10 dark:border-[#C9A35A]/20 flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#68736D] dark:text-[#96A39D] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#C9A35A]" />
              Prayer Begins In
            </span>
            <PrayerCountdown
              targetDate={resolution.nextScheduledDate}
              className="text-[#203C32] dark:text-[#E8D8B2]"
            />
          </div>
        )}

        {/* Warm invitation subtext */}
        <div className="my-4 p-3.5 rounded-2xl bg-[#203C32]/5 dark:bg-[#203C32]/20 border border-[#203C32]/10 dark:border-[#203C32]/30">
          <p className="text-xs text-[#203C32] dark:text-[#E8D8B2] font-medium leading-relaxed">
            {isWaiting
              ? 'The sanctuary doors are open. Enter to pray and wait in quiet contemplation.'
              : (organization.joinPageMessage || 'Join your church family in corporate prayer.')}
          </p>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoin} className="space-y-4 text-left">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-[#B94A48]/30 text-[#B94A48] dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="attendeeName"
              className="block text-xs font-bold text-[#16251F] dark:text-[#F8F7F3] uppercase tracking-wider mb-2"
            >
              Your Name
            </label>
            <input
              id="attendeeName"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Kenneth, Sarah, Deacon John"
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-[#16251F] dark:text-[#F8F7F3] font-medium text-base placeholder:text-[#68736D]/60 focus:outline-none focus:border-[#203C32] dark:focus:border-[#C9A35A] transition-all shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] shadow-lg hover:shadow-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-[#C9A35A] dark:text-[#101814]" />
            <span>{isWaiting ? 'Enter Sanctuary' : 'Join Prayer'}</span>
          </button>
        </form>

        {/* Privacy & Safe Joining Guarantees */}
        <div className="mt-6 pt-5 border-t border-[#E5E6E1] dark:border-[#26362F] space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#68736D] dark:text-[#96A39D]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>No account required.</span>
          </div>
          <p className="text-[11px] text-[#68736D] dark:text-[#96A39D] leading-relaxed">
            Microphone and camera stay off unless a prayer leader invites you to speak. Server-enforced media permissions activate with the realtime media engine.
          </p>
        </div>
      </main>

      {/* Simplified Mobile-Friendly Footer */}
      <footer className="w-full max-w-md mx-auto pt-6 pb-2 text-center text-xs text-[#68736D] dark:text-[#96A39D]">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="inline-flex items-center gap-1 hover:text-[#203C32] dark:hover:text-[#F8F7F3] underline cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Connection Help
          </button>

          <span>•</span>

          {/* Data Saver Mode Selector */}
          <div className="inline-flex items-center gap-1.5">
            <span>Data Saver:</span>
            <select
              aria-label="Data Saver Mode"
              value={dataSaverMode}
              onChange={(e) => setDataSaverMode(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-[#203C32] dark:text-[#C9A35A] border-none focus:outline-none cursor-pointer"
            >
              <option value="AUTOMATIC">Auto</option>
              <option value="ON">On (Save Data)</option>
              <option value="OFF">Off</option>
            </select>
          </div>

          <span>•</span>

          <a href="/privacy" className="hover:text-[#203C32] dark:hover:text-[#F8F7F3] underline">
            Privacy
          </a>
        </div>
      </footer>

      {/* Connection Help Modal */}
      {showHelpModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-[#17221D] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E5E6E1] dark:border-[#26362F] text-left">
            <h3 className="text-lg font-bold text-[#16251F] dark:text-[#F8F7F3] mb-2">
              Joining & Connection Help
            </h3>
            <div className="text-xs text-[#68736D] dark:text-[#96A39D] space-y-2.5 leading-relaxed">
              <p>
                <strong>No Login Needed:</strong> Simply enter your name and tap Join Prayer.
              </p>
              <p>
                <strong>Hearing prayer audio:</strong> If you don't hear sound once the live gathering begins, check that your phone volume or device speaker is turned up.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E5E6E1] dark:border-[#26362F] flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-[#203C32] text-white font-medium text-xs dark:bg-[#C9A35A] dark:text-[#101814]"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
