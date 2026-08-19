import React from 'react';
import { SanctumLogo } from '../components/common/SanctumLogo';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Show, SignIn, UserButton } from '@clerk/react';
import { Lock, Sun, Moon } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { clerkConfigured, membershipDenied, needsOnboarding } = useAuth();
  const { isDarkMode, toggleDarkMode } = useApp();

  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] flex flex-col justify-between p-4 sm:p-6 transition-colors">
      <header className="max-w-md w-full mx-auto flex items-center justify-between pt-2 pb-6">
        <button onClick={() => onNavigate('/')} className="cursor-pointer">
          <SanctumLogo size="md" showTagline />
        </button>
        <div className="flex items-center gap-2">
          {clerkConfigured && (
            <Show when="signed-in">
              <UserButton afterSignOutUrl="/" />
            </Show>
          )}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-[#C9A35A]" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto my-auto bg-white dark:bg-[#17221D] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E5E6E1] dark:border-[#26362F]">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
            Church Admin Sign In
          </h1>
          <p className="text-xs text-[#68736D] dark:text-[#96A39D] mt-1">
            Create a Sanctum Space or join one you were invited to. Congregants join with a prayer link and their name —
            no account.
          </p>
        </div>

        {!clerkConfigured && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-medium">
            Add VITE_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY, then sign in to create your Sanctum Space.
          </div>
        )}

        {needsOnboarding && (
          <div className="space-y-3">
            <p className="text-xs text-[#68736D] dark:text-[#96A39D] leading-relaxed">
              You are signed in. Name your church to open your Sanctum Space.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/onboarding')}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] cursor-pointer"
            >
              Create your Sanctum Space
            </button>
          </div>
        )}

        {membershipDenied && !needsOnboarding && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-[#B94A48]/30 text-[#B94A48] dark:text-red-400 text-xs font-medium leading-relaxed">
            Sign in failed. Try again, or ask the space Owner to invite your email as Admin.
          </div>
        )}

        {clerkConfigured && !membershipDenied && !needsOnboarding && (
          <div className="flex justify-center">
            <SignIn
              routing="hash"
              forceRedirectUrl="/onboarding"
              appearance={{
                variables: {
                  colorPrimary: '#203C32',
                  borderRadius: '0.75rem',
                },
              }}
            />
          </div>
        )}
      </main>

      <footer className="max-w-md w-full mx-auto text-center text-xs text-[#68736D] dark:text-[#96A39D] pt-4">
        Starting a church prayer space?{' '}
        <button
          onClick={() => onNavigate('/onboarding')}
          className="font-bold text-[#203C32] dark:text-[#C9A35A] hover:underline"
        >
          Create a Sanctum Space
        </button>
      </footer>
    </div>
  );
};
