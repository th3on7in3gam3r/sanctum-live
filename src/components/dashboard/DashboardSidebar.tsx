import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  LayoutGrid,
  Radio,
  FileText,
  Users,
  Settings,
  Home,
  Calendar,
  BookOpen,
  Bell,
  Mail,
  Images,
  Hand,
  CalendarClock,
  ShieldAlert,
  ScrollText,
  HandHeart,
  ChevronDown,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { cmsApi } from '../../services/api/cmsApi';
import { PLCC_ONE_URL } from '../../lib/plccLinks';

interface DashboardSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onShowTutorial?: () => void;
  showPastorWalkthrough?: boolean;
  className?: string;
}

type Item = {
  label: string;
  icon: React.ElementType;
  path?: string;
  href?: string;
  onClick?: () => void;
  badge?: number;
  active?: boolean;
  tour?: string;
};

/**
 * PLCC Sanctum moderator sidebar (approved "Prayer Operations Center" mockup):
 * forest green, gold active item, emblem + PLCC SANCTUM, kente corner.
 * Church website tools sit in their own group underneath.
 */
export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ currentPath, onNavigate, className }) => {
  const { user, organization } = useAuth();
  const { raisedHands = [], liveSession, prayerRooms = [] } = useApp();
  const [reviewCount, setReviewCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const inChurch = currentPath.startsWith('/dashboard/church') || currentPath.startsWith('/dashboard/gallery');
  const [churchOpen, setChurchOpen] = useState(inChurch);
  const mediaOnly = user?.role === 'MEDIA';
  const handsWaiting = raisedHands.filter((h) => h.status === 'WAITING').length;
  const liveRoomId =
    liveSession && ['LIVE', 'STARTING', 'WAITING'].includes(String(liveSession.status)) ? liveSession.prayerRoomId : null;

  useEffect(() => {
    if (user?.role !== 'OWNER' && user?.role !== 'ADMIN') return;
    cmsApi.listGalleryAlbums(organization.id).then((result) => setReviewCount(result.reviewCount)).catch(() => undefined);
  }, [organization.id, user?.role]);

  useEffect(() => {
    if (inChurch) setChurchOpen(true);
  }, [inChurch]);

  const goRooms = () => {
    onNavigate('/dashboard');
    window.setTimeout(() => document.getElementById('ops-rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  const moderatorItems: Item[] = [
    { label: 'Control Room', path: '/dashboard', icon: LayoutGrid, active: currentPath === '/dashboard', tour: 'dashboard-nav' },
    { label: 'Live Rooms', icon: Radio, onClick: goRooms },
    { label: 'Participants', path: '/dashboard/participants', icon: Users },
    {
      label: 'Raised Hands',
      icon: Hand,
      badge: handsWaiting,
      onClick: () => (liveRoomId ? onNavigate(`/dashboard/prayer-rooms/${liveRoomId}/control`) : goRooms()),
      active: currentPath.includes('/control'),
    },
    { label: 'Prayer Requests', path: '/dashboard/prayer-requests', icon: HandHeart },
    { label: 'Room Schedule', path: '/dashboard/prayer-rooms', icon: CalendarClock, active: currentPath.startsWith('/dashboard/prayer-rooms') && !currentPath.includes('/control') },
    { label: 'Reports & Incidents', href: PLCC_ONE_URL, icon: ShieldAlert },
    { label: 'Audit Log', path: '/dashboard/audit', icon: ScrollText },
    { label: 'Settings', path: '/dashboard/settings', icon: Settings, tour: 'dashboard-settings' },
  ];
  const churchItems: Item[] = [
    { label: 'Church overview', path: '/dashboard/church', icon: LayoutGrid, active: currentPath === '/dashboard/church' },
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
  const items: Item[] = mediaOnly ? [{ label: 'Gallery', path: '/dashboard/gallery', icon: Images }] : moderatorItems;

  const isActive = (item: Item) => item.active ?? (item.path ? currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path)) : false);

  const renderItem = (item: Item, small = false) => {
    const Icon = item.icon;
    const active = isActive(item);
    const content = (
      <>
        <Icon className={cn('shrink-0', small ? 'h-4 w-4' : 'h-[22px] w-[22px]')} aria-hidden />
        {collapsed ? null : <span className="min-w-0 flex-1 truncate">{item.label}</span>}
        {item.badge ? <span className="ops-side-badge">{item.badge}</span> : null}
        {!collapsed && item.href ? <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden /> : null}
      </>
    );
    const cls = cn('ops-side-item', small && 'is-small', active && 'is-active', collapsed && 'is-collapsed');
    if (item.href) {
      return (
        <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={cls} title={collapsed ? item.label : undefined}>
          {content}
        </a>
      );
    }
    return (
      <button
        key={item.label}
        type="button"
        onClick={() => (item.onClick ? item.onClick() : item.path && onNavigate(item.path))}
        className={cls}
        aria-current={active ? 'page' : undefined}
        title={collapsed ? item.label : undefined}
        {...(item.tour ? { 'data-tour': item.tour } : {})}
      >
        {content}
      </button>
    );
  };

  return (
    <aside className={cn('ops-side', collapsed && 'is-collapsed', className)} aria-label="Moderator navigation">
      <div className="ops-side-scroll">
        <div className="ops-side-brand">
          <img src="/prayer-room/prayer-emblem.png" alt="" aria-hidden className="ops-side-emblem" />
          {collapsed ? null : (
            <>
              <p className="ops-side-title">
                <span>PLCC</span>
                <span className="is-gold">SANCTUM</span>
              </p>
              <p className="ops-side-tag">Prayer Rooms • Live Prayer (Overflow)</p>
            </>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="ops-side-collapse"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className="ops-side-nav">{items.map((item) => renderItem(item))}</nav>

        {mediaOnly ? null : (
          <div className="ops-side-group">
            <button type="button" onClick={() => setChurchOpen((v) => !v)} aria-expanded={churchOpen} className={cn('ops-side-item is-small', collapsed && 'is-collapsed')}>
              <Globe className="h-4 w-4 shrink-0" aria-hidden />
              {collapsed ? null : <span className="flex-1 text-left">Church website</span>}
              {collapsed ? null : <ChevronDown className={cn('h-4 w-4 transition-transform', churchOpen && 'rotate-180')} aria-hidden />}
            </button>
            {churchOpen ? <div className="ops-side-sub">{churchItems.map((item) => renderItem(item, true))}</div> : null}
          </div>
        )}

        <div className="ops-side-divider" />
        <a href={PLCC_ONE_URL} className={cn('ops-side-item', collapsed && 'is-collapsed')} title={collapsed ? 'Back to PLCC ONE' : undefined}>
          <Home className="h-[22px] w-[22px] shrink-0" aria-hidden />
          {collapsed ? null : <span>Back to PLCC ONE</span>}
        </a>
        {prayerRooms.length === 0 && !mediaOnly && !collapsed ? (
          <p className="ops-side-note">No prayer rooms yet — create one from the Control Room.</p>
        ) : null}
      </div>
      <div className="ops-side-kente" aria-hidden />
    </aside>
  );
};
