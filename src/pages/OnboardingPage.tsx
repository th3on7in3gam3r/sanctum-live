import React, { useState } from 'react';
import { Show, SignInButton, UserButton } from '@clerk/react';
import { SanctumLogo } from '../components/common/SanctumLogo';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { slugify } from '../lib/utils';
import { ApiClientError, sanctumApi } from '../services/api/sanctumApi';
import { ArrowRight, Building, Sun, Moon } from 'lucide-react';
import { LogoUrlField, isHttpUrl } from '../components/common/LogoUrlField';

interface OnboardingPageProps {
  onNavigate: (path: string) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { clerkConfigured, isAuthenticated, refreshAuth } = useAuth();
  const { isDarkMode, toggleDarkMode, addToast } = useApp();
  const [churchName, setChurchName] = useState('');
  const [churchSlug, setChurchSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleNameChange = (value: string) => {
    setChurchName(value);
    setChurchSlug(slugify(value));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchName.trim()) {
      addToast('Enter your church name.', 'warning');
      return;
    }
    if (logoUrl.trim() && !isHttpUrl(logoUrl.trim())) {
      addToast('Logo must be a public http or https image URL.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await sanctumApi.createSpace({
        name: churchName.trim(),
        slug: churchSlug.trim() || slugify(churchName),
        logoUrl: logoUrl.trim() || undefined,
      });
      await refreshAuth();
      addToast('Your Sanctum Space is ready.', 'success');
      onNavigate('/dashboard');
    } catch (error) {
      addToast(error instanceof ApiClientError ? error.message : 'Could not create your Sanctum Space.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const form = (
    <form onSubmit={handleCreate} className="mt-6 space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1.5">
          Church name
        </label>
        <input
          type="text"
          required
          value={churchName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. Grace Assembly"
          className="w-full px-4 py-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-sm font-semibold"
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase text-[#16251F] dark:text-[#F8F7F3] mb-1.5">
          Space link
        </label>
        <div className="flex items-center px-4 py-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-xs font-mono text-[#68736D] dark:text-[#96A39D]">
          <span>sanctum.live/</span>
          <input
            type="text"
            value={churchSlug}
            onChange={(e) => setChurchSlug(slugify(e.target.value))}
            className="flex-1 bg-transparent font-bold text-[#16251F] dark:text-[#F8F7F3] focus:outline-none"
          />
        </div>
      </div>
      <LogoUrlField value={logoUrl} onChange={setLogoUrl} />
      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-3 rounded-xl font-bold text-sm bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {submitting ? 'Creating…' : 'Enter your Sanctum Space'}
        {!submitting && <ArrowRight className="w-4 h-4" />}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] flex flex-col p-4 sm:p-6 transition-colors">
      <header className="max-w-xl w-full mx-auto flex items-center justify-between pt-2 pb-6">
        <button type="button" onClick={() => onNavigate('/')} className="cursor-pointer">
          <SanctumLogo size="md" showTagline />
        </button>
        <div className="flex items-center gap-2">
          {clerkConfigured && (
            <Show when="signed-in">
              <UserButton afterSignOutUrl="/" />
            </Show>
          )}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-[#C9A35A]" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-xl w-full mx-auto my-auto bg-white dark:bg-[#17221D] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E5E6E1] dark:border-[#26362F]">
        <div className="w-12 h-12 rounded-2xl bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center mb-4">
          <Building className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
          Create your Sanctum Space
        </h1>
        <p className="text-sm text-[#68736D] dark:text-[#96A39D] mt-2 leading-relaxed">
          You will be the Owner. Invite Admins later to help run prayer rooms. Congregation still joins with a name — no
          account.
        </p>

        {!clerkConfigured && (
          <div className="mt-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-medium">
            Add Clerk keys to sign in and create a Sanctum Space.
          </div>
        )}

        {clerkConfigured && (
          <>
            <Show when="signed-out">
              <div className="mt-6">
                <SignInButton mode="modal" forceRedirectUrl="/onboarding">
                  <button
                    type="button"
                    className="w-full px-4 py-3 rounded-xl font-bold text-sm bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] cursor-pointer"
                  >
                    Sign in to continue
                  </button>
                </SignInButton>
              </div>
            </Show>
            <Show when="signed-in">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => onNavigate('/dashboard')}
                  className="mt-6 w-full px-4 py-3 rounded-xl font-bold text-sm bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] cursor-pointer flex items-center justify-center gap-2"
                >
                  Enter your Sanctum Space
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                form
              )}
            </Show>
          </>
        )}
      </main>
    </div>
  );
};
