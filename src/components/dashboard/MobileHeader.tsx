import React, { useState } from 'react';
import { StaffBrand } from './StaffBrand';
import { churchSiteUrl, isChurchMode } from '../../lib/appMode';
import { UserButton } from '@clerk/react';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Sun, Moon, LogOut, Radio, LayoutDashboard, FileText, Users, History, Settings, CircleHelp, Home, Calendar, BookOpen, Bell, Mail, Images } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PrayerRoomShortcuts } from './PrayerRoomShortcuts';
import { cn } from '../../lib/utils';

interface MobileHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onShowTutorial?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentPath,
  onNavigate,
  onShowTutorial,
}) => {
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
    { label: 'Church', path: '/dashboard/church', icon: LayoutDashboard },
    { label: 'Members', path: '/dashboard/church/members', icon: Users },
    { label: 'Households', path: '/dashboard/church/households', icon: Home },
    { label: 'Groups', path: '/dashboard/church/groups', icon: Users },
    { label: 'Leaders', path: '/dashboard/church/leaders', icon: Users },
    { label: 'Visit questions', path: '/dashboard/church/faqs', icon: FileText },
    { label: 'Visitors', path: '/dashboard/church/visitors', icon: Mail },
    { label: 'Events', path: '/dashboard/church/events', icon: Calendar },
    { label: 'Sermons', path: '/dashboard/church/sermons', icon: BookOpen },
    { label: 'Gallery', path: '/dashboard/gallery', icon: Images },
    { label: 'Announcements', path: '/dashboard/church/announcements', icon: Bell },
    { label: 'Website Pages', path: '/dashboard/church/pages', icon: FileText },
  ];

  const items = user?.role === 'MEDIA' ? [{ label: 'Gallery', path: '/dashboard/gallery', icon: Images }] : navItems;

  const handleNav = (path: string) => {
    onNavigate(path);
    setIsOpen(false);
  };

  return (
    <>
      <header className="staff-sidebar md:hidden flex items-center justify-between p-4 bg-card border-b border-line sticky top-0 z-40">
        <StaffBrand size="sm" />
        <div className="flex items-center gap-2">
          <UserButton afterSignOutUrl={isChurchMode() ? churchSiteUrl() : '/'} />
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-muted"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-gold" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            className="p-2 rounded-xl text-ink hover:bg-black/5 dark:hover:bg-white/5"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Slide-out mobile drawer */}
      {isOpen && (
        <div className="staff-sidebar md:hidden fixed inset-0 z-50 flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-white/15">
              <StaffBrand />
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                {isChurchMode() ? 'Church' : 'Sanctum Space'}
              </p>
              <p className="text-xs font-bold text-ink">{organization.name}</p>
              <p className="text-[11px] text-muted">Logged in as {user?.name}</p>
            </div>

            <nav className="mt-6 space-y-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/dashboard' || item.path === '/dashboard/church'
                  ? currentPath === item.path
                  : currentPath.startsWith(item.path);
                return (
                  <React.Fragment key={item.path}>
                    <button
                      onClick={() => handleNav(item.path)}
                      className={cn(
                        'w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-base font-semibold transition-colors text-left',
                        isActive
                          ? 'ui-nav-active'
                          : 'text-muted hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                    {item.path === '/dashboard/prayer-rooms' ? (
                      <PrayerRoomShortcuts
                        onNavigate={(path) => {
                          onNavigate(path);
                          setIsOpen(false);
                        }}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-line space-y-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                window.open('/join', '_blank', 'noopener,noreferrer');
              }}
              className="w-full py-3 rounded-2xl text-sm font-bold text-center bg-green/10 text-green dark:bg-gold/10 dark:text-gold"
            >
              Preview Public Join Link
            </button>
            {onShowTutorial && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onShowTutorial();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-muted bg-black/5 dark:bg-white/5"
              >
                <CircleHelp className="w-4 h-4" />
                <span>Pastor walkthrough</span>
              </button>
            )}
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-danger bg-red-500/10"
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
