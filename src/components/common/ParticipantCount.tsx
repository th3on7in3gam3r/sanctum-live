import React from 'react';
import { Users } from 'lucide-react';
import { formatNumber, cn } from '../../lib/utils';

interface ParticipantCountProps {
  count?: number | null;
  suffix?: string;
  emptyLabel?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ParticipantCount: React.FC<ParticipantCountProps> = ({
  count,
  suffix = 'praying together',
  emptyLabel = 'Waiting for participants',
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs gap-1.5 py-0.5 px-2',
    md: 'text-sm gap-2 py-1 px-3',
    lg: 'text-base gap-2.5 py-1.5 px-4',
  };
  const hasPresence = typeof count === 'number' && count > 0;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full bg-[#16251F]/5 dark:bg-[#F8F7F3]/10 text-[#203C32] dark:text-[#E8D8B2] font-medium border border-[#E5E6E1] dark:border-[#26362F]',
        sizeClasses[size],
        className
      )}
    >
      <Users className="w-4 h-4 text-[#3D6655] dark:text-[#C9A35A] shrink-0" />
      <span>
        {hasPresence ? (
          <>
            <strong className="font-semibold">{formatNumber(count)}</strong>{' '}
            <span className="text-[#68736D] dark:text-[#96A39D]">{suffix}</span>
          </>
        ) : (
          <span className="text-[#68736D] dark:text-[#96A39D]">{emptyLabel}</span>
        )}
      </span>
    </div>
  );
};
