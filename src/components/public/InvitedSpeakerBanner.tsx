import React from 'react';
import { Mic, Sparkles } from 'lucide-react';

interface InvitedSpeakerBannerProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  canAccept?: boolean;
}

export const InvitedSpeakerBanner: React.FC<InvitedSpeakerBannerProps> = ({
  isOpen,
  onAccept,
  onDecline,
  canAccept = true,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="speaker-invite-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in zoom-in-95 duration-200"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#17221D] rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-[#C9A35A] text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-2xl bg-[#C9A35A]/15 text-[#C9A35A] flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Mic className="w-8 h-8 text-[#203C32] dark:text-[#C9A35A]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#203C32]/10 dark:bg-[#C9A35A]/20 text-[#203C32] dark:text-[#E8D8B2] text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Prayer Leader Invitation
        </div>

        <h2 id="speaker-invite-title" className="text-2xl font-bold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
          You're invited to pray
        </h2>

        <p className="mt-2 text-sm text-[#68736D] dark:text-[#96A39D] leading-relaxed">
          A prayer leader would like you to speak and lead the congregation in prayer now.
        </p>

        {/* Informative Note */}
        <div className="my-5 p-3.5 rounded-2xl bg-[#F8F7F3] dark:bg-[#101814] border border-[#E5E6E1] dark:border-[#26362F] text-xs text-[#68736D] dark:text-[#96A39D]">
          {canAccept
            ? 'When you tap Accept, your microphone will be enabled to lead in prayer.'
            : 'The prayer session has not started yet. The host must tap Start Prayer before you can speak.'}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onDecline}
            type="button"
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] font-semibold text-sm text-[#68736D] dark:text-[#96A39D] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Not Now
          </button>
          <button
            onClick={onAccept}
            type="button"
            disabled={!canAccept}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl font-bold text-sm bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {canAccept ? 'Accept & Pray' : 'Waiting for Start'}
          </button>
        </div>
      </div>
    </div>
  );
};
