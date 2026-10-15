import React, { useEffect, useState } from 'react';
import { StaffBrand } from './StaffBrand';
import { churchSiteUrl, isChurchMode } from '../../lib/appMode';
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
  Home,
  Calendar,
  BookOpen,
  Bell,
  Mail,
  LogOut,
  Building,
  Sun,
  Moon,
  ExternalLink,
  CircleHelp,
  Images,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { promptInstall } from '../../pwa';
import { cn } from '../../lib/utils';
import { cmsApi } from '../../services/api/cmsApi';
import { PrayerRoomShortcuts } from './PrayerRoomShortcuts';

interface DashboardSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onShowTutorial?: () => void;
  showPastorWalkthrough?: boolean;
  className?: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  currentPath,
  onNavigate,
  onShowTutorial,
  showPastorWalkthrough = false,
  className,
}) => {
  const { user, organization, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useApp();
  const [reviewCount, setReviewCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const mediaOnly = user?.role === 'MEDIA';
  useEffect(() => {
    if (user?.role !== 'OWNER' && user?.role !== 'ADMIN') return;
    cmsApi.listGalleryAlbums(organization.id).then((result) => setReviewCount(result.reviewCount)).catch(() => undefined);
  }, [organization.id, user?.role]);

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Prayer Rooms', path: '/dashboard/prayer-rooms', icon: Radio },
    { label: 'Prayer Requests', path: '/dashboard/prayer-requests', icon: FileText },
    { label: 'Participants', path: '/dashboard/participants', icon: Users },
    { label: 'History', path: '/dashboard/history', icon: History },
    { label: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];
  const churchItems = [
    { label: 'Overview', path: '/dashboard/church', icon: LayoutDashboard },
    { label: 'Members', path: '/dashboard/church/members', icon: Users },
    { label: 'Households', path: '/dashboard/church/households', icon: Home },
    { label: 'Groups', path: '/dashboard/church/groups', icon: Users },
    { label: 'Leaders', path: '/dashboard/church/leaders', icon: Users },
    { label: 'Visit questions', path: '/dashboard/church/faqs', icon: FileText },
    { label: 'Visitors', path: '/dashboard/church/visitors', icon: Mail },
    { label: 'Events', path: '/dashboard/church/events', icon: Calendar },
    { label: 'Sermons', path: '/dashboard/church/sermons', icon: BookOpen },
    { label: 'Gallery', path: '/dashboard/gallery', icon: Images, badge: reviewCount },
    { label: 'Announcements', path: '/dashboard/church/announcements', icon: Bell },
    { label: 'Website Pages', path: '/dashboard/church/pages', icon: FileText },
  ];

  return (
    <aside
      className={cn(
        'h-screen flex flex-col justify-between bg-card border-r border-line p-4 select-none shrink-0 transition-[width,colors] duration-200',
        collapsed ? 'w-[4.75rem]' : 'w-80',
        className
      )}
    >
      {/* Top Section: Logo & Church Switcher */}
      <div className="space-y-6 flex-1 min-h-0 overflow-y-auto">
        <div className={cn('flex pt-2', collapsed ? 'flex-col items-center gap-2' : 'items-start justify-between gap-2')}>
          <StaffBrand size="sm" variant={collapsed ? 'mark' : 'full'} />
          <button
            type="button"
            onClick={() => setCollapsed((open) => !open)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="shrink-0 rounded-xl p-2 text-muted hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Organization Switcher Card */}
        <div className="p-3 rounded-2xl bg-paper border border-line">
          <div className="flex items-center gap-2.5">
            {organization.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt=""
                className="w-8 h-8 rounded-xl object-cover bg-green"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-green dark:bg-gold text-white dark:text-paper flex items-center justify-center font-bold text-xs">
                <Building className="w-4 h-4" />
              </div>
            )}
            {collapsed ? null : <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                {isChurchMode() ? 'Church' : 'Sanctum Space'}
              </p>
              <h4 className="text-xs font-bold text-ink truncate">
                {organization.name}
              </h4>
              {isChurchMode() ? null : (
                <p className="text-[11px] text-muted truncate">
                  sanctum.live/{organization.slug}
                </p>
              )}
            </div>}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1" data-tour="dashboard-nav">
          {(mediaOnly ? [{ label: 'Gallery', path: '/dashboard/gallery', icon: Images, badge: 0 }] : navItems).map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/dashboard'
                ? currentPath === '/dashboard'
                : currentPath.startsWith(item.path);
            const tourAttr =
              item.path === '/dashboard/settings' ? { 'data-tour': 'dashboard-settings' } : {};

            return (
              <React.Fragment key={item.path}>
                <button
                  onClick={() => onNavigate(item.path)}
                  {...tourAttr}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer text-left',
                    isActive
                      ? 'ui-nav-active shadow-xs'
                      : 'text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-white dark:text-paper' : 'text-current')} />
                  {collapsed ? null : <span>{item.label}</span>}
                </button>
                {!collapsed && item.path === '/dashboard/prayer-rooms' ? <PrayerRoomShortcuts onNavigate={onNavigate} /> : null}
              </React.Fragment>
            );
          })}
        </nav>
        {mediaOnly ? null : <div className="space-y-1">
          {collapsed ? null : <p className="px-3.5 pt-2 text-[10px] font-bold uppercase tracking-wide text-muted">Church</p>}
          {churchItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/dashboard/church' ? currentPath === item.path : currentPath.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left',
                  isActive
                    ? 'ui-nav-active shadow-xs'
                    : 'text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-white dark:text-paper' : 'text-current')} />
                {collapsed ? null : <span>{item.label}</span>}
                {item.path === '/dashboard/gallery' && reviewCount ? <span className="ml-auto rounded-full bg-[#C9A35A] px-2 py-0.5 text-[10px] text-[#101814]">{reviewCount}</span> : null}
              </button>
            );
          })}
        </div>}
      </div>

      {/* Bottom Section: User Profile & Actions */}
      <div className="pt-4 border-t border-line space-y-3">
        {/* Quick link to public join preview */}
        <button
          type="button"
          onClick={() => window.open('/join', '_blank', 'noopener,noreferrer')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-green dark:text-gold bg-green/10 dark:bg-gold/10 hover:bg-green/12 transition-colors cursor-pointer"
        >
          {collapsed ? null : <span>Open Public Join Page</span>}
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
        >
          {collapsed ? 'App' : 'Install app'}
        </button>
        {onShowTutorial && (
          <button
            type="button"
            onClick={onShowTutorial}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left"
          >
            <CircleHelp className="w-3.5 h-3.5 shrink-0" />
            {collapsed ? null : <span>{showPastorWalkthrough ? 'Resume walkthrough' : 'Pastor walkthrough'}</span>}
          </button>
        )}

        {/* User Card */}
        <div className="rounded-2xl bg-paper border border-line p-3 space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            <UserButton afterSignOutUrl={isChurchMode() ? churchSiteUrl() : '/'} />
            {collapsed ? null : <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-bold text-ink truncate leading-tight">
                {user?.name || 'Church administrator'}
              </p>
              {user && (
                <RoleBadge
                  role={user.role}
                  size="sm"
                  className="max-w-full"
                />
              )}
            </div>}
          </div>

          <div className="flex items-center gap-1.5 pt-2 border-t border-line">
            <button
              type="button"
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to light' : 'Switch to dusk'}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-muted hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-gold" /> : <Moon className="w-3.5 h-3.5" />}
              {collapsed ? null : <span>{isDarkMode ? 'Light' : 'Dusk'}</span>}
            </button>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-danger hover:bg-red-500/10 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              {collapsed ? null : <span>Sign out</span>}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
