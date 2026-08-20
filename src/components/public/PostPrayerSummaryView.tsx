import React, { useState } from 'react';
import { SanctumLogo } from '../common/SanctumLogo';
import {
  CheckCircle2,
  Users,
  Calendar,
  Heart,
  FileText,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PrayerRoom, PrayerSession } from '../../types';

interface PostPrayerSummaryViewProps {
  room: PrayerRoom;
  session?: PrayerSession | null;
  participantName: string;
  onExit: () => void;
  onSubmitPrayerRequest?: () => void;
}

export const PostPrayerSummaryView: React.FC<PostPrayerSummaryViewProps> = ({
  room,
  session,
  participantName,
  onExit,
  onSubmitPrayerRequest,
}) => {
  const { isDarkMode, toggleDarkMode, submitPrayerRequest, addToast } = useApp();
  const { isAuthenticated } = useAuth();

  const [testimony, setTestimony] = useState('');
  const [testimonySubmitted, setTestimonySubmitted] = useState(false);
  const [showTestimonyBox, setShowTestimonyBox] = useState(false);

  const totalGathered = session?.totalUniqueParticipants || session?.totalParticipants || 0;

  const handleSubmitTestimony = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimony.trim()) return;

    submitPrayerRequest({
      request: `[Praise/Testimony]: ${testimony.trim()}`,
      isPrivate: false,
      participantName: participantName || 'Member',
      roomName: room.name,
    });

    setTestimonySubmitted(true);
    addToast('Praise testimony submitted to ministry leaders!', 'success');
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header */}
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

      {/* Main Card */}
      <main className="w-full max-w-md mx-auto my-auto bg-white dark:bg-[#17221D] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E5E6E1] dark:border-[#26362F] text-center space-y-6">
        {/* Completion Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
            Prayer Complete
          </h1>
          <p className="text-sm text-[#68736D] dark:text-[#96A39D] mt-1">
            Thank you for praying with us, <strong>{participantName}</strong>.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#F8F7F3] dark:bg-[#101814] border border-[#E5E6E1] dark:border-[#26362F] text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#68736D] dark:text-[#96A39D] flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#C9A35A]" />
              Gathered
            </span>
            <p className="text-lg font-extrabold text-[#16251F] dark:text-[#F8F7F3] mt-0.5">
              {totalGathered > 0 ? totalGathered.toLocaleString() : '—'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F7F3] dark:bg-[#101814] border border-[#E5E6E1] dark:border-[#26362F] text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#68736D] dark:text-[#96A39D] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#203C32] dark:text-[#E8D8B2]" />
              Next Prayer
            </span>
            <p className="text-xs font-bold text-[#203C32] dark:text-[#C9A35A] mt-1 truncate">
              Tomorrow • {room.scheduledStart}
            </p>
          </div>
        </div>

        {/* Testimony box or CTA buttons */}
        {showTestimonyBox ? (
          testimonySubmitted ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium space-y-1">
              <p className="font-bold">Testimony Received</p>
              <p>May God bless you as you testify of His goodness!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitTestimony} className="text-left space-y-3">
              <label className="block text-xs font-bold text-[#16251F] dark:text-[#F8F7F3] uppercase tracking-wider">
                Share a Testimony / Praise Report
              </label>
              <textarea
                value={testimony}
                onChange={(e) => setTestimony(e.target.value)}
                placeholder="Share how God moved during prayer..."
                rows={3}
                className="w-full p-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3] dark:bg-[#101814] text-xs text-[#16251F] dark:text-[#F8F7F3] focus:outline-none focus:border-[#203C32] dark:focus:border-[#C9A35A]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTestimonyBox(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#68736D] dark:text-[#96A39D] hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl font-bold text-xs bg-[#203C32] hover:bg-[#16251F] text-white dark:bg-[#C9A35A] dark:text-[#101814]"
                >
                  Submit Testimony
                </button>
              </div>
            </form>
          )
        ) : (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setShowTestimonyBox(true)}
              className="w-full py-3 rounded-2xl font-bold text-xs border border-[#203C32] dark:border-[#C9A35A] text-[#203C32] dark:text-[#E8D8B2] hover:bg-[#203C32]/5 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Heart className="w-4 h-4 text-[#C9A35A]" />
              <span>Share a Testimony</span>
            </button>

            {onSubmitPrayerRequest && (
              <button
                type="button"
                onClick={onSubmitPrayerRequest}
                className="w-full py-3 rounded-2xl font-bold text-xs bg-[#F8F7F3] dark:bg-[#101814] hover:bg-black/5 text-[#16251F] dark:text-[#F8F7F3] border border-[#E5E6E1] dark:border-[#26362F] flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#68736D]" />
                <span>Submit a Prayer Request</span>
              </button>
            )}
          </div>
        )}

        {/* Exit to Home */}
        <button
          type="button"
          onClick={onExit}
          className="w-full py-3.5 rounded-2xl font-bold text-sm bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{isAuthenticated ? 'Back to Dashboard' : 'Exit Gathering'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </main>

      <footer className="w-full max-w-md mx-auto text-center pt-2 text-[11px] text-[#68736D] dark:text-[#96A39D]">
        May the grace of our Lord Jesus Christ be with you always.
      </footer>
    </div>
  );
};
