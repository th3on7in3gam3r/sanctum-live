import React, { useState } from 'react';
import { PrayerRoom, PrayerSession } from '../../types';
import { PrayerSessionStatus } from '../common/PrayerSessionStatus';
import { ParticipantCount } from '../common/ParticipantCount';
import { resolveAltarLink } from '../../services/altarLinkResolver';
import {
  Radio,
  Copy,
  Check,
  Sliders,
  ExternalLink,
  Calendar,
  Users,
  ShieldCheck,
  Play,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NextSessionCardProps {
  room: PrayerRoom;
  liveSession: PrayerSession | null;
  onOpenControlRoom: (roomId: string) => void;
  onOpenPublicJoin: (slug: string) => void;
  onEditRoom: (roomId: string) => void;
  onOpenTestRoom?: () => void;
  onOpenPrePrayerCheck?: () => void;
}

export const NextSessionCard: React.FC<NextSessionCardProps> = ({
  room,
  liveSession,
  onOpenControlRoom,
  onOpenPublicJoin,
  onEditRoom,
  onOpenTestRoom,
  onOpenPrePrayerCheck,
}) => {
  const { addToast, historySessions, openSanctuary } = useApp();
  const [copied, setCopied] = useState(false);

  const resolution = resolveAltarLink(room, liveSession, historySessions);
  const isLive = resolution.status === 'LIVE';
  const isWaiting = resolution.status === 'WAITING';
  const attendeeCount = isLive ? liveSession?.totalParticipants : undefined;

  const fullUrl = `https://sanctum.live/join/${room.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    addToast('Permanent prayer link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-white to-[#F8F7F3] dark:from-[#17221D] dark:via-[#17221D] dark:to-[#101814] border-2 border-[#203C32]/20 dark:border-[#C9A35A]/30 shadow-md relative overflow-hidden">
      {/* Gold ambient accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A35A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left Section: Session Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <PrayerSessionStatus status={resolution.status} size="md" />
            <ParticipantCount
              count={attendeeCount}
              size="sm"
              emptyLabel={isLive ? 'Waiting for participants' : 'Prayer has not started'}
            />
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
              {room.name}
            </h3>
            <p className="text-sm text-[#68736D] dark:text-[#96A39D] mt-1 flex items-center gap-2 flex-wrap">
              <span>{room.isRecurring ? `Recurring (${room.recurrenceRule || 'Daily'})` : 'One-time'}</span>
              <span>•</span>
              <span className="font-semibold text-[#203C32] dark:text-[#E8D8B2]">
                Scheduled for {room.scheduledStart} ({room.timezone})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#C9A35A]" />
                Expected: {room.expectedAttendance.toLocaleString()}
              </span>
            </p>
          </div>

          {/* Permanent Link display & Copy */}
          <div className="flex items-center gap-2 pt-1 max-w-lg">
            <div className="flex-1 px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-[#E5E6E1] dark:border-[#26362F] text-xs font-mono text-[#68736D] dark:text-[#96A39D] truncate">
              {fullUrl}
            </div>
            <button
              onClick={handleCopyLink}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#203C32]/10 dark:bg-[#C9A35A]/20 text-[#203C32] dark:text-[#E8D8B2] hover:bg-[#203C32]/15 transition-colors cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Right Section: Action CTAs */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
          {/* Main primary CTA */}
          {isLive ? (
            <button
              onClick={() => onOpenControlRoom(room.id)}
              type="button"
              className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-[#D7473F] hover:bg-[#C23C35] text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Live Control Room™</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {onOpenPrePrayerCheck && (
                <button
                  onClick={onOpenPrePrayerCheck}
                  type="button"
                  className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pre-Prayer Check™</span>
                </button>
              )}

              {!isWaiting && (
                <button
                  onClick={() => openSanctuary(room.id)}
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Open Sanctuary (Waiting Room)</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {onOpenTestRoom && (
              <button
                onClick={onOpenTestRoom}
                type="button"
                className="px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-[#203C32]/30 dark:border-[#C9A35A]/40 bg-[#203C32]/5 dark:bg-[#C9A35A]/10 text-[#203C32] dark:text-[#E8D8B2] hover:bg-[#203C32]/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Test Room</span>
              </button>
            )}

            <button
              onClick={() => onOpenPublicJoin(room.slug)}
              type="button"
              className="flex-1 px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-[#E5E6E1] dark:border-[#26362F] bg-white dark:bg-[#17221D] hover:bg-gray-50 dark:hover:bg-white/5 text-[#16251F] dark:text-[#F8F7F3] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C9A35A]" />
              <span>Join View</span>
            </button>

            <button
              onClick={() => onEditRoom(room.id)}
              type="button"
              className="px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-[#E5E6E1] dark:border-[#26362F] hover:bg-gray-50 dark:hover:bg-white/5 text-[#68736D] dark:text-[#96A39D] transition-colors cursor-pointer"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
