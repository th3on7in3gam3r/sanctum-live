import React from 'react';
import { Volume2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LiveBadge } from './LiveBadge';

interface AudioVisualizerPlaceholderProps {
  speakerName: string;
  speakerTitle?: string;
  isLive?: boolean;
  className?: string;
}

export const AudioVisualizerPlaceholder: React.FC<AudioVisualizerPlaceholderProps> = ({
  speakerName,
  speakerTitle = 'Live Prayer',
  isLive = true,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-6 sm:p-10 rounded-[32px] bg-white dark:bg-[#17221D] border border-[#E5E6E1] dark:border-[#26362F] shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Background Circular Geometric Accent */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-[#F8F7F3] dark:bg-[#101814] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none" />

      {isLive && (
        <div className="mb-4 z-10">
          <LiveBadge size="sm" />
        </div>
      )}

      {/* Concentric Geometric Audio Ring */}
      <div className="relative z-10 mb-5">
        <div className="w-36 sm:w-40 h-36 sm:h-40 rounded-full border border-[#E8D8B2] dark:border-[#3D6655] flex items-center justify-center animate-subtle-pulse">
          <div className="w-28 sm:w-32 h-28 sm:h-32 rounded-full bg-[#F8F7F3] dark:bg-[#101814] flex items-center justify-center border-4 border-white dark:border-[#17221D] shadow-inner">
            <div className="flex gap-1.5 items-end h-9">
              <div className="w-1.5 h-6 bg-[#C9A35A] rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-10 bg-[#C9A35A] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-8 bg-[#C9A35A] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              <div className="w-1.5 h-12 bg-[#203C32] dark:bg-[#E8D8B2] rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
              <div className="w-1.5 h-7 bg-[#C9A35A] rounded-full animate-pulse" style={{ animationDelay: '250ms' }} />
            </div>
          </div>
        </div>

        {/* Floating Mic Pill */}
        <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-[#203C32] dark:bg-[#C9A35A] rounded-full border-4 border-white dark:border-[#17221D] flex items-center justify-center text-white dark:text-[#101814] text-xs shadow-md">
          <Volume2 className="w-4 h-4" />
        </div>
      </div>

      {/* Speaker Information */}
      <div className="text-center z-10 max-w-sm">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A35A] block mb-1">
          Currently Speaking
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-[#203C32] dark:text-[#F8F7F3]">
          {speakerName}
        </h2>
        <p className="text-xs text-[#68736D] dark:text-[#96A39D] mt-0.5">
          {speakerTitle}
        </p>
      </div>

      {/* Architectural Integration Note */}
      <div className="mt-6 z-10 text-[10px] font-bold uppercase tracking-widest text-[#68736D]/70 dark:text-[#96A39D]/70 bg-[#F8F7F3] dark:bg-[#101814] px-3 py-1 rounded-full border border-[#E5E6E1] dark:border-[#26362F]">
        Prayer Audio Preview
      </div>
    </div>
  );
};
