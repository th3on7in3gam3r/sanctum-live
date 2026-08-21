import React from 'react';
import { SanctumLogo } from '../common/SanctumLogo';
import { RoleBadge } from '../common/RoleBadge';
import { UserButton } from '@clerk/react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Radio,
  FileText,
  Users,
  History,
  Settings,
  LogOut,
  Building,
  Sun,
  Moon,
  ExternalLink,
  CircleHelp,
} from 'lucide-react';
import { promptInstall } from '../../pwa';
import { cn } from '../../lib/utils';

interface DashboardSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onShowTutorial?: () => void;
  className?: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  currentPath,
  onNavigate,
  onShowTutorial,
  className,
}) => {
  const { user, organization, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useApp();

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Prayer Rooms', path: '/dashboard/prayer-rooms', icon: Radio },
    { label: 'Prayer Requests', path: '/dashboard/prayer-requests', icon: FileText },
    { label: 'Participants', path: '/dashboard/participants', icon: Users },
    { label: 'History', path: '/dashboard/history', icon: History },
    { label: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'w-64 h-screen flex flex-col justify-between bg-white dark:bg-[#17221D] border-r border-[#E5E6E1] dark:border-[#26362F] p-4 select-none shrink-0 transition-colors',
        className
      )}
    >
      {/* Top Section: Logo & Church Switcher */}
      <div className="space-y-6">
        <div className="px-2 pt-2">
          <SanctumLogo size="md" showTagline />
        </div>

        {/* Organization Switcher Card */}
        <div className="p-3 rounded-2xl bg-[#F8F7F3] dark:bg-[#101814] border border-[#E5E6E1] dark:border-[#26362F]">
          <div className="flex items-center gap-2.5">
            {organization.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt=""
                className="w-8 h-8 rounded-xl object-cover bg-[#203C32]"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#203C32] dark:bg-[#C9A35A] text-white dark:text-[#101814] flex items-center justify-center font-bold text-xs">
                <Building className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#68736D] dark:text-[#96A39D]">
                Sanctum Space
              </p>
              <h4 className="text-xs font-bold text-[#16251F] dark:text-[#F8F7F3] truncate">
                {organization.name}
              </h4>
              <p className="text-[11px] text-[#68736D] dark:text-[#96A39D] truncate">
                sanctum.live/{organization.slug}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1" data-tour="dashboard-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/dashboard'
                ? currentPath === '/dashboard'
                : currentPath.startsWith(item.path);
            const tourAttr =
              item.path === '/dashboard/settings' ? { 'data-tour': 'dashboard-settings' } : {};

            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                {...tourAttr}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left',
                  isActive
                    ? 'bg-[#203C32] text-white dark:bg-[#C9A35A] dark:text-[#101814] shadow-xs'
                    : 'text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#16251F] dark:hover:text-[#F8F7F3]'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-white dark:text-[#101814]' : 'text-current')} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: User Profile & Actions */}
      <div className="pt-4 border-t border-[#E5E6E1] dark:border-[#26362F] space-y-3">
        {/* Quick link to public join preview */}
        <button
          onClick={() => onNavigate('/join')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#203C32] dark:text-[#C9A35A] bg-[#203C32]/8 dark:bg-[#C9A35A]/10 hover:bg-[#203C32]/12 transition-colors cursor-pointer"
        >
          <span>Open Public Join Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
        >
          Install app
        </button>
        {onShowTutorial && (
          <button
            type="button"
            onClick={onShowTutorial}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
          >
            <CircleHelp className="w-3.5 h-3.5 shrink-0" />
            <span>Show tutorial</span>
          </button>
        )}

        {/* User Card */}
        <div className="rounded-2xl bg-[#F8F7F3] dark:bg-[#101814] border border-[#E5E6E1] dark:border-[#26362F] p-3 space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            <UserButton afterSignOutUrl="/" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-bold text-[#16251F] dark:text-[#F8F7F3] truncate leading-tight">
                {user?.name || 'Church administrator'}
              </p>
              {user && (
                <RoleBadge
                  role={user.role}
                  size="sm"
                  className="max-w-full"
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-2 border-t border-[#E5E6E1] dark:border-[#26362F]">
            <button
              type="button"
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-[#68736D] dark:text-[#96A39D] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-[#C9A35A]" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-[#B94A48] hover:bg-red-500/10 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
