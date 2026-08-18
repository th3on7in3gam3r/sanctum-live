import React, { useState } from 'react';
import { SanctumLogo } from '../common/SanctumLogo';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Sun, Moon, LogOut, Radio, LayoutDashboard, FileText, Users, History, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';

interface MobileHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ currentPath, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { organization, user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useApp();

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Prayer Rooms', path: '/dashboard/prayer-rooms', icon: Radio },
    { label: 'Prayer Requests', path: '/dashboard/prayer-requests', icon: FileText },
    { label: 'Participants', path: '/dashboard/participants', icon: Users },
    { label: 'History', path: '/dashboard/history', icon: History },
    { label: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const handleNav = (path: string) => {
    onNavigate(path);
    setIsOpen(false);
  };

  return (
    <>
      <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#17221D] border-b border-[#E5E6E1] dark:border-[#26362F] sticky top-0 z-40">
        <SanctumLogo size="sm" />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-[#68736D] dark:text-[#96A39D]"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-[#C9A35A]" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            className="p-2 rounded-xl text-[#16251F] dark:text-[#F8F7F3] hover:bg-black/5 dark:hover:bg-white/5"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Slide-out mobile drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-between p-6 bg-white dark:bg-[#17221D]">
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-[#E5E6E1] dark:border-[#26362F]">
              <SanctumLogo size="md" showTagline />
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
              <p className="text-xs font-bold text-[#16251F] dark:text-[#F8F7F3]">{organization.name}</p>
              <p className="text-[11px] text-[#68736D] dark:text-[#96A39D]">Logged in as {user?.name}</p>
            </div>

            <nav className="mt-6 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={cn(
                      'w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-base font-semibold transition-colors text-left',
                      isActive
                        ? 'bg-[#203C32] text-white dark:bg-[#C9A35A] dark:text-[#101814]'
                        : 'text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-[#E5E6E1] dark:border-[#26362F] space-y-3">
            <button
              onClick={() => handleNav('/join/morning-prayer')}
              className="w-full py-3 rounded-2xl text-sm font-bold text-center bg-[#203C32]/10 text-[#203C32] dark:bg-[#C9A35A]/10 dark:text-[#C9A35A]"
            >
              Preview Public Join Link
            </button>
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-[#B94A48] bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
