import React, { useEffect, useState } from 'react';
import { Users, ShieldCheck, Moon, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PrayerRoom, PrayerSession } from '../../types';
import { BackButton } from '../common/BackButton';

interface SanctuaryWaitingViewProps {
  room: PrayerRoom;
  session?: PrayerSession | null;
  participantName: string;
  onSessionLive: () => void;
  onBack?: () => void;
}

const SCRIPTURES = [
  {
    verse: 'O God, you are my God, earnestly I seek you; my soul thirsts for you, my body longs for you, in a dry and parched land where there is no water.',
    reference: 'Psalm 63:1',
  },
  {
    verse: 'For where two or three gather in my name, there am I with them.',
    reference: 'Matthew 18:20',
  },
  {
    verse: 'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.',
    reference: 'Psalm 100:4',
  },
  {
    verse: 'The Lord is near to all who call on him, to all who call on him in truth.',
    reference: 'Psalm 145:18',
  },
];

export const SanctuaryWaitingView: React.FC<SanctuaryWaitingViewProps> = ({
  room,
  participantName,
  onSessionLive,
  onBack,
}) => {
  const { isDarkMode, toggleDarkMode, liveSession, connectedNow, connectionState } = useApp();
  const [scriptureIndex, setScriptureIndex] = useState(0);

  // Auto transition if liveSession becomes LIVE
  useEffect(() => {
    if (liveSession?.status === 'LIVE' && liveSession?.prayerRoomId === room.id) {
      onSessionLive();
    }
  }, [liveSession, room.id, onSessionLive]);

  // Rotate scriptures gently
  useEffect(() => {
    const timer = setInterval(() => {
      setScriptureIndex((prev) => (prev + 1) % SCRIPTURES.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const scripture = SCRIPTURES[scriptureIndex];

  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-2 pb-4">
        <BackButton
          to={`/join/${room.slug}`}
          label="Back to Join Page"
          mobileLabel="Back"
          onClick={onBack}
        />
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          className="p-2 rounded-xl text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-[#C9A35A]" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Sanctuary Card */}
      <main className="w-full max-w-md mx-auto my-auto bg-white dark:bg-[#17221D] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E5E6E1] dark:border-[#26362F] text-center space-y-6 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#C9A35A]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>The Sanctuary is Open</span>
        </div>

        {/* Room Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
            {room.name}
          </h1>
          <p className="text-sm font-semibold text-[#203C32] dark:text-[#C9A35A] mt-1">
            Prayer begins shortly
          </p>
          <p className="text-xs text-[#68736D] dark:text-[#96A39D] mt-0.5">
            Scheduled for {room.scheduledStart} ({room.timezone})
          </p>
        </div>

        {/* Waiting badge with live counter */}
        <div className="py-3 px-4 rounded-2xl bg-[#F8F7F3] dark:bg-[#101814] border border-[#E5E6E1] dark:border-[#26362F] flex items-center justify-center gap-2 text-xs font-semibold text-[#16251F] dark:text-[#F8F7F3]">
          <Users className="w-4 h-4 text-[#C9A35A]" />
          <span>
            {connectionState === 'CONNECTED' && connectedNow > 0
              ? `${connectedNow} gathered in the sanctuary`
              : 'Waiting for participants'}
          </span>
        </div>

        {/* Welcome Attendee Greeting */}
        <div className="text-xs text-[#68736D] dark:text-[#96A39D]">
          Welcome, <strong className="text-[#16251F] dark:text-[#F8F7F3]">{participantName}</strong>. Please rest in quiet contemplation. You will enter the live prayer session automatically the moment leaders begin.
        </div>

        {/* Scripture Quote Box */}
        <div className="p-5 rounded-2xl bg-[#203C32]/5 dark:bg-[#203C32]/25 border border-[#203C32]/10 dark:border-[#203C32]/30 text-left space-y-2 min-h-[110px] flex flex-col justify-center">
          <p className="text-xs italic text-[#203C32] dark:text-[#E8D8B2] leading-relaxed">
            "{scripture.verse}"
          </p>
          <span className="text-[11px] font-bold text-[#C9A35A] uppercase tracking-wider">
            — {scripture.reference}
          </span>
        </div>

        {/* Safety & Mic guarantees */}
        <div className="pt-2 border-t border-[#E5E6E1] dark:border-[#26362F] flex items-center justify-center gap-2 text-[11px] text-[#68736D] dark:text-[#96A39D]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Microphone remains configured off for listeners until a leader invites you.</span>
        </div>
      </main>

      {/* Footer / Dev simulation button */}
      <footer className="w-full max-w-md mx-auto text-center pt-2">
        {connectionState !== 'CONNECTED' ? (
          <button
            type="button"
            onClick={onSessionLive}
            className="text-[11px] font-medium text-[#68736D] hover:text-[#203C32] dark:hover:text-[#C9A35A] underline cursor-pointer"
          >
            Simulate Prayer Starting →
          </button>
        ) : null}
      </footer>
    </div>
  );
};
