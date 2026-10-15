import React from 'react';
import { SanctumLogo } from '../components/common/SanctumLogo';
import { sanctumTheme } from '../components/public/ChurchWordmark';
import { StaffBrand } from '../components/dashboard/StaffBrand';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Show, SignIn, UserButton } from '@clerk/react';
import { Sun, Moon } from 'lucide-react';
import { CHURCH_PUBLIC_NAME, churchSiteUrl, isChurchMode, leaveToHome } from '../lib/appMode';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { clerkConfigured, membershipDenied, needsOnboarding } = useAuth();
  const { isDarkMode, toggleDarkMode } = useApp();
  const church = isChurchMode();
  const site = churchSiteUrl();
  const theme = sanctumTheme(isDarkMode);

  return (
    <div data-staff data-staff-theme={theme} className="min-h-screen flex flex-col justify-between p-4 sm:p-6 transition-colors">
      <header className="max-w-md w-full mx-auto flex items-center justify-between pt-2 pb-6">
        {church ? (
          <StaffBrand size="md" />
        ) : (
          <button type="button" onClick={() => leaveToHome(onNavigate)} className="cursor-pointer">
            <SanctumLogo size="md" showTagline />
          </button>
        )}
        <div className="flex items-center gap-2">
          {clerkConfigured && (
            <Show when="signed-in">
              <UserButton afterSignOutUrl={church ? site : '/'} />
            </Show>
          )}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-ink cursor-pointer"
            aria-label={isDarkMode ? 'Switch to light' : 'Switch to dusk'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="ui-card mx-auto my-auto w-full max-w-md p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="font-display text-[28px] leading-tight text-ink">
            {church ? `${CHURCH_PUBLIC_NAME} — Staff sign in` : 'Church admin sign in'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {church
              ? 'Sign in to run prayer, the gallery, and the church dashboard.'
              : 'Create a Sanctum Space or join one you were invited to. Congregants join with a prayer link and their name — no account.'}
          </p>
        </div>

        {!clerkConfigured && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-medium">
            Add VITE_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY, then sign in to create your Sanctum Space.
          </div>
        )}

        {needsOnboarding && (
          <div className="space-y-3">
            <p className="text-xs text-muted leading-relaxed">
              You are signed in. Name your church to open your Sanctum Space.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/onboarding')}
              className="ui-button w-full"
            >
              Create your Sanctum Space
            </button>
          </div>
        )}

        {membershipDenied && !needsOnboarding && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-danger/30 text-danger text-xs font-medium leading-relaxed">
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
                  colorPrimary: '#C9A35A',
                  colorPrimaryForeground: '#16251F',
                  colorBackground: isDarkMode ? '#1A3328' : '#FFFCF6',
                  colorForeground: isDarkMode ? '#F6F1E6' : '#16251F',
                  colorInput: isDarkMode ? '#10241C' : '#F5F1E8',
                  colorInputForeground: isDarkMode ? '#F6F1E6' : '#16251F',
                  borderRadius: '999px',
                },
              }}
            />
          </div>
        )}
      </main>

      <footer className="max-w-md w-full mx-auto text-center text-xs text-muted pt-4 space-y-2">
        {church ? (
          <a href={site} className="font-semibold text-ink hover:underline">Back to the website</a>
        ) : (
          <p>
            Starting a church prayer space?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/onboarding')}
              className="font-bold text-ink hover:underline"
            >
              Create a Sanctum Space
            </button>
          </p>
        )}
        <p>Powered by Sanctum Live</p>
      </footer>
    </div>
  );
};
