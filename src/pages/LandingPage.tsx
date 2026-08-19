import React, { useState } from 'react';
import { SanctumLogo } from '../components/common/SanctumLogo';
import { ClerkNavAuth } from '../components/common/ClerkNavAuth';
import { StartPrayerRoomCta } from '../components/common/StartPrayerRoomCta';
import { LiveBadge } from '../components/common/LiveBadge';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Sliders,
  Users,
  Smartphone,
  Wifi,
  Sun,
  Moon,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { isDarkMode, toggleDarkMode, addToast } = useApp();

  // Interactive Live Preview State
  const [amenCount, setAmenCount] = useState(1420);
  const [praiseCount, setPraiseCount] = useState(890);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [previewReactionFloater, setPreviewReactionFloater] = useState<string | null>(null);

  const handleAmen = () => {
    setAmenCount((prev) => prev + 1);
    setPreviewReactionFloater('🙏');
    setTimeout(() => setPreviewReactionFloater(null), 1200);
  };

  const handlePraise = () => {
    setPraiseCount((prev) => prev + 1);
    setPreviewReactionFloater('❤️');
    setTimeout(() => setPreviewReactionFloater(null), 1200);
  };

  const handleRaiseHand = () => {
    setHasRaisedHand((prev) => !prev);
    addToast(
      hasRaisedHand
        ? 'Hand lowered in live preview'
        : '✋ Hand raised! In a live gathering, your prayer leader receives this instantly.',
      'info'
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] text-[#16251F] dark:text-[#F8F7F3] transition-colors flex flex-col justify-between font-sans selection:bg-[#E8D8B2] selection:text-[#203C32]">
      {/* Geometric Nav */}
      <nav className="px-6 sm:px-12 py-6 sm:py-8 flex items-center justify-between z-10 border-b border-[#E5E6E1]/60 dark:border-[#26362F]/60">
        <div className="flex items-center gap-3">
          <SanctumLogo size="lg" />
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            type="button"
            className="hidden sm:inline-block text-sm font-medium text-[#68736D] hover:text-[#203C32] dark:hover:text-[#E8D8B2] transition-colors cursor-pointer"
          >
            See How It Works
          </button>

          <button
            onClick={() => onNavigate('/join')}
            type="button"
            className="hidden sm:inline-block text-sm font-medium text-[#68736D] hover:text-[#203C32] dark:hover:text-[#E8D8B2] transition-colors cursor-pointer"
          >
            Join Prayer
          </button>

          <button
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
            className="p-2 rounded-full text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-[#C9A35A]" /> : <Moon className="w-4 h-4" />}
          </button>

          <ClerkNavAuth onNavigate={onNavigate} />
        </div>
      </nav>

      {/* Main 12-Column Geometric Balance Hero */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 sm:px-12 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column: Typography & Intent */}
        <div className="lg:col-span-6 flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-[#C9A35A] font-bold text-xs sm:text-sm tracking-[0.2em] uppercase">
              Prayer without barriers
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] text-[#203C32] dark:text-[#F8F7F3] tracking-tight">
              The sanctuary <br className="hidden sm:inline" />
              for every <br className="hidden sm:inline" />
              congregation.
            </h1>
            <p className="text-base sm:text-lg text-[#68736D] dark:text-[#96A39D] leading-relaxed max-w-lg mt-2">
              Bring your church together for prayer without complicated software, confusing permissions, accidental unmuting, or technical barriers.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <StartPrayerRoomCta onNavigate={onNavigate} />

              <button
                onClick={() => onNavigate('/join')}
                className="px-8 py-4 sm:py-5 bg-white dark:bg-[#17221D] border border-[#E5E6E1] dark:border-[#26362F] text-[#203C32] dark:text-[#F8F7F3] hover:border-[#203C32] dark:hover:border-[#C9A35A] rounded-2xl font-bold text-base sm:text-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer"
              >
                Join Prayer
              </button>
            </div>

            {/* Trust badge with overlapping geometric avatar circles */}
            <div className="flex items-center gap-4 py-2 text-xs sm:text-sm font-medium text-[#68736D] dark:text-[#96A39D]">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#E8D8B2] border-2 border-[#F8F7F3] dark:border-[#101814] flex items-center justify-center text-[10px] font-bold text-[#203C32]">
                  UG
                </div>
                <div className="w-8 h-8 rounded-full bg-[#3D6655] border-2 border-[#F8F7F3] dark:border-[#101814] flex items-center justify-center text-[10px] font-bold text-white">
                  KE
                </div>
                <div className="w-8 h-8 rounded-full bg-[#C9A35A] border-2 border-[#F8F7F3] dark:border-[#101814] flex items-center justify-center text-[10px] font-bold text-[#16251F]">
                  US
                </div>
              </div>
              <span>Built for churches of every size.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Geometric Live Prayer Room Preview Card */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-[500px] bg-white dark:bg-[#17221D] rounded-[40px] shadow-2xl border border-[#E5E6E1] dark:border-[#26362F] p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden transition-colors">
            <span className="absolute top-5 left-6 z-20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A]">
              Product preview
            </span>
            {/* Background Circular Geometric Watermark */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F8F7F3] dark:bg-[#101814] rounded-full -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none" />

            {/* Header: LIVE Status + Count + Time */}
            <div className="flex items-center justify-between z-10 mt-6">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-[#D7473F] text-white text-[10px] font-black rounded-md tracking-widest flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>LIVE</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#16251F] dark:text-[#F8F7F3]">
                  <div className="w-1.5 h-1.5 bg-[#203C32] dark:bg-[#C9A35A] rounded-full animate-ping" />
                  <span>1,847 praying together</span>
                </div>
              </div>
              <div className="text-xs font-bold text-[#68736D] dark:text-[#96A39D] tabular-nums tracking-wider font-mono">
                00:42:16
              </div>
            </div>

            {/* Concentric Speaker Audio Circle */}
            <div className="flex flex-col items-center gap-4 py-2 z-10 relative">
              {previewReactionFloater && (
                <div className="absolute top-0 text-4xl animate-bounce pointer-events-none z-30">
                  {previewReactionFloater}
                </div>
              )}

              <div className="relative">
                {/* Outer Ring */}
                <div className="w-36 sm:w-40 h-36 sm:h-40 rounded-full border border-[#E8D8B2] dark:border-[#3D6655] flex items-center justify-center animate-subtle-pulse">
                  {/* Inner Ring with Audio Bars */}
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

              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-[#203C32] dark:text-[#F8F7F3]">
                  Pastor Kenneth
                </h3>
                <p className="text-xs sm:text-sm text-[#68736D] dark:text-[#96A39D] font-medium">
                  Morning Prayer • Miracle Center Kampala
                </p>
              </div>
            </div>

            {/* Reaction Grid: Amen & Praise God */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 z-10">
              <button
                type="button"
                onClick={handleAmen}
                className="h-20 bg-[#F8F7F3] dark:bg-[#101814] rounded-2xl flex flex-col items-center justify-center gap-1 border border-[#E5E6E1] dark:border-[#26362F] hover:bg-[#E8D8B2]/40 dark:hover:bg-[#203C32]/40 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <span className="text-2xl">🙏</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#203C32] dark:text-[#F8F7F3]">
                  Amen ({amenCount})
                </span>
              </button>

              <button
                type="button"
                onClick={handlePraise}
                className="h-20 bg-[#F8F7F3] dark:bg-[#101814] rounded-2xl flex flex-col items-center justify-center gap-1 border border-[#E5E6E1] dark:border-[#26362F] hover:bg-[#E8D8B2]/40 dark:hover:bg-[#203C32]/40 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <span className="text-2xl">❤️</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#203C32] dark:text-[#F8F7F3]">
                  Praise God ({praiseCount})
                </span>
              </button>
            </div>

            {/* Bottom Actions: Raise Hand & Prayer Request */}
            <div className="flex gap-3 pt-3 border-t border-[#F8F7F3] dark:border-[#26362F] z-10">
              <button
                type="button"
                onClick={handleRaiseHand}
                className={`flex-1 py-3.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide border-2 transition-all cursor-pointer ${
                  hasRaisedHand
                    ? 'bg-[#C9A35A] text-[#101814] border-[#C9A35A]'
                    : 'bg-white dark:bg-[#17221D] border-[#C9A35A] text-[#C9A35A] hover:bg-[#C9A35A]/10'
                }`}
              >
                {hasRaisedHand ? '✋ Hand Raised' : 'Raise Hand'}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/join')}
                className="flex-1 py-3.5 bg-[#203C32] hover:bg-[#16251F] dark:bg-[#C9A35A] dark:hover:bg-[#D6B36E] text-white dark:text-[#101814] rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer"
              >
                Prayer Request
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Geometric Feature Grid */}
      <section id="how-it-works" className="py-16 px-6 sm:px-12 max-w-7xl mx-auto w-full space-y-10 border-t border-[#E5E6E1] dark:border-[#26362F]">
        <div className="text-center space-y-2">
          <span className="text-[#C9A35A] font-bold text-xs tracking-[0.2em] uppercase">
            Designed for Worship
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#203C32] dark:text-[#F8F7F3]">
            Built for congregations, not conference rooms.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#17221D] border border-[#E5E6E1] dark:border-[#26362F] space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#16251F] dark:text-[#F8F7F3]">
              One-Tap Zero-Login Entry
            </h3>
            <p className="text-xs text-[#68736D] dark:text-[#96A39D] leading-relaxed">
              Elderly and non-technical members join in under 3 seconds without downloading apps or remembering passwords.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#17221D] border border-[#E5E6E1] dark:border-[#26362F] space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#16251F] dark:text-[#F8F7F3]">
              Listener Isolation
            </h3>
            <p className="text-xs text-[#68736D] dark:text-[#96A39D] leading-relaxed">
              Attendee microphones are configured off by default. Server-enforced media permissions activate with the realtime media engine.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#17221D] border border-[#E5E6E1] dark:border-[#26362F] space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#16251F] dark:text-[#F8F7F3]">
              Prayer Control Room™
            </h3>
            <p className="text-xs text-[#68736D] dark:text-[#96A39D] leading-relaxed">
              Empowers pastors and intercession leaders with real-time speaker invites, queue management, and request monitoring.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#17221D] border border-[#E5E6E1] dark:border-[#26362F] space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#16251F] dark:text-[#F8F7F3]">
              Scales to 50,000+ Believers
            </h3>
            <p className="text-xs text-[#68736D] dark:text-[#96A39D] leading-relaxed">
              Engineered on a global edge architecture to support citywide and international 24/7 corporate prayer altars.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#17221D] border border-[#E5E6E1] dark:border-[#26362F] space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#16251F] dark:text-[#F8F7F3]">
              Mobile-First Thumb Experience
            </h3>
            <p className="text-xs text-[#68736D] dark:text-[#96A39D] leading-relaxed">
              Over 90% of congregation members pray on phones. Every interaction is tactile and optimized for one-hand use.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#17221D] border border-[#E5E6E1] dark:border-[#26362F] space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center font-bold">
              <Wifi className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#16251F] dark:text-[#F8F7F3]">
              Data Saver for Slower Connections
            </h3>
            <p className="text-xs text-[#68736D] dark:text-[#96A39D] leading-relaxed">
              Reduces media bandwidth where possible to improve the prayer experience on slower connections. Realtime media optimization activates when the Sanctum media engine is connected.
            </p>
          </div>
        </div>
      </section>

      {/* Geometric Balanced Deep Sanctuary Green Footer Strip */}
      <footer className="px-6 sm:px-12 py-10 bg-[#203C32] text-[#F8F7F3] flex flex-col md:flex-row items-center justify-between gap-8 mt-12">
        <div className="flex flex-wrap items-center gap-8 sm:gap-12 text-left">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9A35A]">
              01. Reach
            </span>
            <span className="font-bold text-sm text-white">Share one simple link</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9A35A]">
              02. Gather
            </span>
            <span className="font-bold text-sm text-white">Members join as listeners</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9A35A]">
              03. Control
            </span>
            <span className="font-bold text-sm text-white">Leaders moderate speakers</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#E8D8B2]/80">
          <span>Secure • Mobile First • Optimized Audio</span>
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('/privacy')} className="hover:text-white cursor-pointer">
              Privacy
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('/terms')} className="hover:text-white cursor-pointer">
              Terms
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
