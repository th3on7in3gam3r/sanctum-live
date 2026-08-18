import React from 'react';
import { RaisedHand } from '../../types';
import { formatTime } from '../../lib/utils';
import { Hand, Mic, X, Clock } from 'lucide-react';

interface RaisedHandRowProps {
  hand: RaisedHand;
  onInviteToPray: (participantId: string) => void;
  onDismiss: (handId: string) => void;
}

export const RaisedHandRow: React.FC<RaisedHandRowProps> = ({
  hand,
  onInviteToPray,
  onDismiss,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#17221D] border border-[#E5E6E1] dark:border-[#26362F] hover:border-[#C9A35A]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#C9A35A]/15 text-[#C9A35A] flex items-center justify-center font-bold text-sm shrink-0">
          <Hand className="w-5 h-5 text-[#203C32] dark:text-[#C9A35A]" />
        </div>

        <div>
          <h4 className="font-bold text-sm text-[#16251F] dark:text-[#F8F7F3]">
            {hand.displayName}
          </h4>
          <div className="flex items-center gap-2 text-xs text-[#68736D] dark:text-[#96A39D] mt-0.5">
            <span className="flex items-center gap-1 font-mono text-amber-700 dark:text-amber-400 font-semibold">
              <Clock className="w-3 h-3" />
              Waiting {formatTime(hand.waitingSeconds)}
            </span>
            {hand.country && <span>• {hand.country}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          onClick={() => onDismiss(hand.id)}
          type="button"
          className="p-2 rounded-xl text-gray-400 hover:text-[#B94A48] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          title="Dismiss request"
        >
          <X className="w-4 h-4" />
        </button>

        <button
          onClick={() => onInviteToPray(hand.participantId)}
          type="button"
          className="px-4 py-2 rounded-xl font-bold text-xs bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Invite to Pray</span>
        </button>
      </div>
    </div>
  );
};
