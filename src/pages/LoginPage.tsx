import React, { useState } from 'react';
import { SanctumLogo } from '../components/common/SanctumLogo';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Lock, Mail, ArrowRight, Sun, Moon, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { isDarkMode, toggleDarkMode, addToast } = useApp();

  const [email, setEmail] = useState('kenneth@miraclecenter.org');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid church administrator email.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const success = login(email.trim());
      if (success) {
        addToast('Signed in successfully as Church Administrator', 'success');
        onNavigate('/dashboard');
      } else {
        setError('Invalid credentials.');
      }
      setIsLoading(false);
    }, 400);
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between pt-2 pb-6">
        <button onClick={() => onNavigate('/')} className="cursor-pointer">
          <SanctumLogo size="md" showTagline />
        </button>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-[#C9A35A]" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Login Card */}
      <main className="max-w-md w-full mx-auto my-auto bg-white dark:bg-[#17221D] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E5E6E1] dark:border-[#26362F]">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#16251F] dark:text-[#F8F7F3] tracking-tight">
            Church Admin Sign In
          </h1>
          <p className="text-xs text-[#68736D] dark:text-[#96A39D] mt-1">
            Access your prayer rooms, live control rooms, and requests
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-[#B94A48]/30 text-[#B94A48] dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#16251F] dark:text-[#F8F7F3] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pastor@yourchurch.org"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/60 dark:bg-[#101814] text-[#16251F] dark:text-[#F8F7F3] text-sm focus:outline-none focus:ring-2 focus:ring-[#203C32] dark:focus:ring-[#C9A35A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#16251F] dark:text-[#F8F7F3] mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/60 dark:bg-[#101814] text-[#16251F] dark:text-[#F8F7F3] text-sm focus:outline-none focus:ring-2 focus:ring-[#203C32] dark:focus:ring-[#C9A35A]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-[#68736D] dark:text-[#96A39D] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-[#203C32] dark:accent-[#C9A35A] rounded"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => addToast('Password reset link sent to registered email', 'info')}
              className="text-xs font-semibold text-[#203C32] dark:text-[#C9A35A] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#203C32] hover:bg-[#16251F] text-[#F8F7F3] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] dark:text-[#101814] shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Selector for evaluation */}
        <div className="mt-6 pt-5 border-t border-[#E5E6E1] dark:border-[#26362F]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#68736D] dark:text-[#96A39D] text-center mb-2">
            Demo Accounts for Testing
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('kenneth@miraclecenter.org')}
              className="p-2 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] text-left text-xs hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              <strong className="block text-[#16251F] dark:text-[#F8F7F3]">Pastor Kenneth</strong>
              <span className="text-[10px] text-gray-500">Senior Pastor / Owner</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('grace@miraclecenter.org')}
              className="p-2 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] text-left text-xs hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              <strong className="block text-[#16251F] dark:text-[#F8F7F3]">Grace Nakato</strong>
              <span className="text-[10px] text-gray-500">Church Administrator</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="max-w-md w-full mx-auto text-center text-xs text-[#68736D] dark:text-[#96A39D] pt-4">
        Need to register a new church?{' '}
        <button
          onClick={() => onNavigate('/onboarding')}
          className="font-bold text-[#203C32] dark:text-[#C9A35A] hover:underline"
        >
          Start Onboarding
        </button>
      </footer>
    </div>
  );
};
