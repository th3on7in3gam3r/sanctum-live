import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, CircleHelp, ExternalLink, LogOut, Moon, Search, Smartphone, Sun } from 'lucide-react';
import { UserButton } from '@clerk/react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useOpsSearch } from '../../context/OpsSearchContext';
import { ROLE_CAPABILITIES } from '../../lib/permissions';
import { churchSiteUrl, isChurchMode } from '../../lib/appMode';
import { promptInstall } from '../../pwa';

interface Props {
  currentPath: string;
  onNavigate: (path: string) => void;
  onShowTutorial?: () => void;
}

/** Moderator top bar (approved mockup): search, notifications, help, and who is signed in. */
export const DashboardTopBar: React.FC<Props> = ({ currentPath, onNavigate, onShowTutorial }) => {
  const { user, logout } = useAuth();
  const { raisedHands = [], prayerRequests = [], liveSession, isDarkMode, toggleDarkMode } = useApp();
  const { query, setQuery } = useOpsSearch();
  const [menu, setMenu] = useState<'help' | 'user' | 'bell' | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hands = raisedHands.filter((h) => h.status === 'WAITING');
  const requests = prayerRequests.filter((r) => r.status === 'PENDING');
  const alerts = hands.length + requests.length;
  const roleLabel = user?.role ? ROLE_CAPABILITIES[user.role]?.label || user.role : 'Moderator';
  const initials = (user?.name || 'M').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  return (
    <div ref={barRef} className="ops-top">
      <form
        className="ops-top-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (currentPath !== '/dashboard') onNavigate('/dashboard');
        }}
      >
        <Search className="h-5 w-5 shrink-0 opacity-60" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search rooms, participants, or reports…"
          aria-label="Search rooms, participants, or reports"
        />
      </form>

      <div className="ops-top-actions">
        <div className="relative">
          <button type="button" onClick={() => setMenu(menu === 'bell' ? null : 'bell')} className="ops-top-icon" aria-label={`Notifications, ${alerts} waiting`} aria-expanded={menu === 'bell'}>
            <Bell className="h-6 w-6" aria-hidden />
            {alerts ? <span className="ops-top-dot">{alerts > 9 ? '9+' : alerts}</span> : null}
          </button>
          {menu === 'bell' ? (
            <div className="ops-top-menu" role="menu">
              <p className="ops-top-menu-title">Waiting for you</p>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenu(null);
                  if (liveSession?.prayerRoomId) onNavigate(`/dashboard/prayer-rooms/${liveSession.prayerRoomId}/control`);
                }}
              >
                {hands.length} raised hand{hands.length === 1 ? '' : 's'}
              </button>
              <button type="button" role="menuitem" onClick={() => { setMenu(null); onNavigate('/dashboard/prayer-requests'); }}>
                {requests.length} prayer request{requests.length === 1 ? '' : 's'} to answer
              </button>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button type="button" onClick={() => setMenu(menu === 'help' ? null : 'help')} className="ops-top-icon" aria-label="Help" aria-expanded={menu === 'help'}>
            <CircleHelp className="h-6 w-6" aria-hidden />
          </button>
          {menu === 'help' ? (
            <div className="ops-top-menu" role="menu">
              {onShowTutorial ? (
                <button type="button" role="menuitem" onClick={() => { setMenu(null); onShowTutorial(); }}>
                  <CircleHelp className="h-4 w-4" aria-hidden /> Pastor walkthrough
                </button>
              ) : null}
              <button type="button" role="menuitem" onClick={() => { setMenu(null); window.open('/join', '_blank', 'noopener,noreferrer'); }}>
                <ExternalLink className="h-4 w-4" aria-hidden /> Open the public join page
              </button>
              <button type="button" role="menuitem" onClick={() => { setMenu(null); void promptInstall(); }}>
                <Smartphone className="h-4 w-4" aria-hidden /> Install the app
              </button>
            </div>
          ) : null}
        </div>

        <span className="ops-top-sep" aria-hidden />

        <div className="relative">
          <button type="button" onClick={() => setMenu(menu === 'user' ? null : 'user')} className="ops-top-user" aria-expanded={menu === 'user'} aria-label="Account">
            <span className="ops-top-avatar">{initials}</span>
            <span className="hidden min-w-0 text-left lg:block">
              <span className="block truncate text-base font-extrabold">{user?.name || 'Moderator'}</span>
              <span className="block truncate text-sm opacity-70">{roleLabel}</span>
            </span>
            <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
          </button>
          {menu === 'user' ? (
            <div className="ops-top-menu is-right" role="menu">
              <div className="flex items-center gap-2 px-3 py-2">
                <UserButton afterSignOutUrl={isChurchMode() ? churchSiteUrl() : '/'} />
                <span className="text-xs opacity-70">Manage your account</span>
              </div>
              <button type="button" role="menuitem" onClick={() => { toggleDarkMode(); setMenu(null); }}>
                {isDarkMode ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
                {isDarkMode ? 'Light mode' : 'Dusk mode'}
              </button>
              <button type="button" role="menuitem" onClick={logout} className="is-danger">
                <LogOut className="h-4 w-4" aria-hidden /> Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
