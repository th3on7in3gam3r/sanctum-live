import React from 'react';
import { cn } from '../../lib/utils';

interface SanctumLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const SanctumLogo: React.FC<SanctumLogoProps> = ({
  size = 'md',
  showTagline = false,
  className,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={cn('inline-flex items-center gap-3 select-none', className)}>
      {/* Geometric Arch & Sanctuary Sound Mark */}
      <div
        className={cn(
          'relative flex items-center justify-center border-2 border-[#C9A35A] rounded-t-full bg-gradient-to-b from-[#203C32]/10 to-transparent dark:from-[#C9A35A]/10 shadow-xs transition-transform hover:scale-105',
          iconSizes[size]
        )}
      >
        <div className="flex items-end gap-0.5 pb-1">
          <div className="w-1 h-2 bg-[#C9A35A] rounded-full opacity-70"></div>
          <div className="w-1 h-4 bg-[#C9A35A] rounded-full"></div>
          <div className="w-1 h-3 bg-[#203C32] dark:bg-[#E8D8B2] rounded-full"></div>
          <div className="w-1 h-2 bg-[#C9A35A] rounded-full opacity-70"></div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={cn('font-extrabold tracking-tight text-[#203C32] dark:text-[#F8F7F3]', textSizes[size])}>
            Sanctum
          </span>
          <span className={cn('font-light tracking-wide text-[#C9A35A]', textSizes[size])}>
            Live<span className="text-[0.6em] align-top font-bold">™</span>
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C9A35A] mt-1">
            Prayer without barriers
          </span>
        )}
      </div>
    </div>
  );
};
