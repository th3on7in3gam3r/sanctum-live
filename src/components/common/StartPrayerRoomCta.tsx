import React from 'react';
import { Show, SignInButton } from '@clerk/react';
import { useAuth } from '../../context/AuthContext';

const clerkAppearance = {
  variables: {
    colorPrimary: '#203C32',
    borderRadius: '0.75rem',
  },
} as const;

const heroButtonClass =
  'px-8 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg shadow-xl shadow-[#203c3215] flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] w-full sm:w-auto';

interface StartPrayerRoomCtaProps {
  onNavigate: (path: string) => void;
}

export const StartPrayerRoomCta: React.FC<StartPrayerRoomCtaProps> = ({ onNavigate }) => {
  const { clerkConfigured, isAuthenticated } = useAuth();

  if (!clerkConfigured) {
    return (
      <button type="button" onClick={() => onNavigate('/onboarding')} className={heroButtonClass}>
        <span>Start a Prayer Room</span>
        <span className="text-xl">→</span>
      </button>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal" forceRedirectUrl="/onboarding" appearance={clerkAppearance}>
          <button type="button" className={heroButtonClass}>
            <span>Start a Prayer Room</span>
            <span className="text-xl">→</span>
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <button
          type="button"
          onClick={() => onNavigate(isAuthenticated ? '/dashboard/prayer-rooms/new' : '/onboarding')}
          className={heroButtonClass}
        >
          <span>Start a Prayer Room</span>
          <span className="text-xl">→</span>
        </button>
      </Show>
    </>
  );
};
