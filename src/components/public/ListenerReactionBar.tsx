import React from 'react';
import { Hand, FileText, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ListenerReactionBarProps {
  isHandRaised: boolean;
  onSendAmen: () => void;
  onSendPraiseGod: () => void;
  onToggleRaiseHand: () => void;
  onOpenPrayerRequest: () => void;
  className?: string;
}

export const ListenerReactionBar: React.FC<ListenerReactionBarProps> = ({
  isHandRaised,
  onSendAmen,
  onSendPraiseGod,
  onToggleRaiseHand,
  onOpenPrayerRequest,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-4 w-full max-w-md mx-auto', className)}>
      {/* Primary Worship Reactions (Amen & Praise God) */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onSendAmen}
          type="button"
          aria-label="Say Amen"
          className="h-20 bg-white dark:bg-[#17221D] rounded-2xl flex flex-col items-center justify-center gap-1 border border-[#E5E6E1] dark:border-[#26362F] hover:bg-[#E8D8B2]/50 dark:hover:bg-[#203C32]/40 transition-colors shadow-2xs active:scale-95 cursor-pointer"
        >
          <span className="text-2xl">🙏</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#203C32] dark:text-[#F8F7F3]">
            Amen
          </span>
        </button>

        <button
          onClick={onSendPraiseGod}
          type="button"
          aria-label="Praise God"
          className="h-20 bg-white dark:bg-[#17221D] rounded-2xl flex flex-col items-center justify-center gap-1 border border-[#E5E6E1] dark:border-[#26362F] hover:bg-[#E8D8B2]/50 dark:hover:bg-[#203C32]/40 transition-colors shadow-2xs active:scale-95 cursor-pointer"
        >
          <span className="text-2xl">❤️</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#203C32] dark:text-[#F8F7F3]">
            Praise God
          </span>
        </button>
      </div>

      {/* Secondary Actions (Raise Hand & Prayer Request) */}
      <div className="flex gap-3 pt-2">
        {/* Raise / Lower Hand */}
        <button
          onClick={onToggleRaiseHand}
          type="button"
          aria-pressed={isHandRaised}
          className={cn(
            'flex-1 py-4 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 cursor-pointer border-2 flex items-center justify-center gap-2',
            isHandRaised
              ? 'bg-[#C9A35A] border-[#C9A35A] text-[#101814] shadow-xs'
              : 'bg-white dark:bg-[#17221D] border-[#C9A35A] text-[#C9A35A] hover:bg-[#C9A35A]/10'
          )}
        >
          {isHandRaised ? (
            <>
              <Check className="w-4 h-4" />
              <span>Hand Raised</span>
            </>
          ) : (
            <>
              <Hand className="w-4 h-4" />
              <span>Raise Hand</span>
            </>
          )}
        </button>

        {/* Prayer Request */}
        <button
          onClick={onOpenPrayerRequest}
          type="button"
          className="flex-1 py-4 bg-[#203C32] hover:bg-[#16251F] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] text-white dark:text-[#101814] rounded-xl font-bold text-sm tracking-wide transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>Prayer Request</span>
        </button>
      </div>

      {/* Raised hand status notice */}
      {isHandRaised && (
        <div className="p-3.5 rounded-2xl bg-[#C9A35A]/10 border border-[#C9A35A]/30 text-center animate-in fade-in">
          <p className="text-xs font-semibold text-[#16251F] dark:text-[#E8D8B2]">
            Your hand is raised in the queue.
          </p>
          <p className="text-[11px] text-[#68736D] dark:text-[#96A39D] mt-0.5">
            A prayer leader will invite you when it's your turn to pray.
          </p>
          <button
            onClick={onToggleRaiseHand}
            type="button"
            className="mt-2 text-xs font-semibold text-[#B94A48] dark:text-red-400 hover:underline cursor-pointer"
          >
            Lower Hand
          </button>
        </div>
      )}
    </div>
  );
};
