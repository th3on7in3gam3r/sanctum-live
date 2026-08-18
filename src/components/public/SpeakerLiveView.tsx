import React from 'react';
import { Mic, Volume2, CheckCircle } from 'lucide-react';
import { LiveBadge } from '../common/LiveBadge';
import { ParticipantCount } from '../common/ParticipantCount';

interface SpeakerLiveViewProps {
  participantName: string;
  participantCount?: number;
  onFinishPrayer: () => void;
}

export const SpeakerLiveView: React.FC<SpeakerLiveViewProps> = ({
  participantName,
  participantCount,
  onFinishPrayer,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 max-w-lg mx-auto text-center rounded-3xl bg-gradient-to-b from-[#203C32]/10 via-[#C9A35A]/5 to-transparent dark:from-[#203C32]/30 dark:via-[#16251F] border-2 border-[#C9A35A]/50 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <LiveBadge size="md" />
        <ParticipantCount count={participantCount} emptyLabel="Waiting for participants" />
      </div>

      {/* Large pulsing microphone state */}
      <div className="relative my-6">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#203C32] to-[#16251F] text-[#C9A35A] flex items-center justify-center shadow-xl border-4 border-[#C9A35A] animate-pulse">
          <Mic className="w-14 h-14" />
        </div>
        <div className="absolute -bottom-2 -right-2 p-2 rounded-full bg-emerald-600 text-white shadow-md">
          <Volume2 className="w-4 h-4" />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
        You're Live
      </h2>
      <p className="mt-2 text-base text-[#203C32] dark:text-[#E8D8B2] font-medium">
        {participantName}, you are praying with {participantCount.toLocaleString()} people.
      </p>

      <p className="mt-1 text-xs text-[#68736D] dark:text-[#96A39D] max-w-sm">
        Speak clearly into your device. The entire congregation is lifting their voices with you.
      </p>

      {/* Big Finish Prayer Button */}
      <div className="mt-8 w-full">
        <button
          onClick={onFinishPrayer}
          type="button"
          className="w-full py-4 px-6 rounded-2xl font-bold text-base bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle className="w-5 h-5" />
          Finish Prayer
        </button>
        <span className="block text-[11px] text-[#68736D] dark:text-[#96A39D] mt-2">
          Tapping will conclude your speaking turn and return you to listener mode.
        </span>
      </div>

      {/* Developer Architecture Note */}
      <div className="mt-8 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#E5E6E1] dark:border-[#26362F] text-left text-[11px] text-[#68736D] dark:text-[#96A39D] leading-relaxed">
        <strong className="text-[#203C32] dark:text-[#C9A35A] block mb-1">
          ⚙️ Phase 1B LiveKit Media Pipeline Note:
        </strong>
        In Phase 1B, this state will:
        <ul className="list-disc pl-4 space-y-0.5 mt-1">
          <li>Request browser mic permission (<code>navigator.mediaDevices.getUserMedia</code>)</li>
          <li>Publish audio track via <code>room.localParticipant.setMicrophoneEnabled(true)</code></li>
          <li>Revoke publish permission upon completion and return token to subscriber-only.</li>
        </ul>
      </div>
    </div>
  );
};
