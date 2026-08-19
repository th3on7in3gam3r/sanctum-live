import React from 'react';
import { Show, SignInButton, UserButton } from '@clerk/react';
import { useAuth } from '../../context/AuthContext';

const clerkAppearance = {
  variables: {
    colorPrimary: '#203C32',
    borderRadius: '0.75rem',
  },
} as const;

const navButtonClass =
  'px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer';

interface ClerkNavAuthProps {
  onNavigate: (path: string) => void;
}

export const ClerkNavAuth: React.FC<ClerkNavAuthProps> = ({ onNavigate }) => {
  const { clerkConfigured, isAuthenticated } = useAuth();

  if (!clerkConfigured) {
    return (
      <button
        onClick={() => onNavigate('/login')}
        className={`${navButtonClass} border border-[#16251F] dark:border-[#E8D8B2] text-[#16251F] dark:text-[#F8F7F3] hover:bg-[#16251F] hover:text-white dark:hover:bg-[#E8D8B2] dark:hover:text-[#101814]`}
      >
        Church Login
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Show when="signed-out">
        <SignInButton mode="modal" forceRedirectUrl="/onboarding" appearance={clerkAppearance}>
          <button
            type="button"
            className={`${navButtonClass} border border-[#16251F] dark:border-[#E8D8B2] text-[#16251F] dark:text-[#F8F7F3] hover:bg-[#16251F] hover:text-white dark:hover:bg-[#E8D8B2] dark:hover:text-[#101814]`}
          >
            Sign in
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => onNavigate('/dashboard')}
            className={`${navButtonClass} border border-[#16251F] dark:border-[#E8D8B2] text-[#16251F] dark:text-[#F8F7F3] hover:bg-[#16251F] hover:text-white dark:hover:bg-[#E8D8B2] dark:hover:text-[#101814]`}
          >
            Sanctum Space
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('/onboarding')}
            className={`${navButtonClass} border border-[#16251F] dark:border-[#E8D8B2] text-[#16251F] dark:text-[#F8F7F3] hover:bg-[#16251F] hover:text-white dark:hover:bg-[#E8D8B2] dark:hover:text-[#101814]`}
          >
            Create space
          </button>
        )}
        <UserButton afterSignOutUrl="/" appearance={clerkAppearance} />
      </Show>
    </div>
  );
};
