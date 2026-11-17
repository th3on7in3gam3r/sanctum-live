import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Hand,
  Headphones,
  Lock,
  Megaphone,
  MoreVertical,
  PlusCircle,
  Radio,
  RefreshCw,
  ScrollText,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ROLE_CAPABILITIES } from '../lib/permissions';
import { fetchHealth, sanctumApi, type ApiHealth } from '../services/api/sanctumApi';
import { BROADCAST_MAX } from '../../shared/broadcast.ts';
import { fetchJordanRooms, JORDAN_ORIGIN, jordanRoomUrl, PLCC_ONE_URL, type JordanRoom } from '../lib/plccLinks';
import { cn } from '../lib/utils';
import { useOpsSearch } from '../context/OpsSearchContext';
import type { PrayerRoom } from '../types';

interface Props {
  onNavigate: (path: string) => void;
}

type Filter = 'all' | 'live' | 'full' | 'scheduled';

interface Row {
  key: string;
  name: string;
  where: string;
  kind: 'main' | 'overflow' | 'restricted' | 'test';
  live: boolean;
  waiting: boolean;
  people: number | null;
  capacity: number | null;
  hands: number | null;
  schedule?: string;
  monitor: () => void;
  manage?: () => void;
  manageLabel?: string;
  thumb: string;
  copyLink?: string;
}

const KIND_LABEL: Record<Row['kind'], string> = {
  main: 'Main',
  overflow: 'Overflow',
  restricted: 'Restricted',
  test: 'Test',
};

const LIVE_STATES = new Set(['LIVE', 'STARTING', 'ENDING']);

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(iso?: string) {
  if (!iso) return '';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function roomKind(room: PrayerRoom): Row['kind'] {
  if (room.isTestRoom) return 'test';
  if (room.hasPasscode || room.allowGuests === false) return 'restricted';
  return 'overflow';
}

function scheduleLabel(room: PrayerRoom) {
  const when = room.scheduledStart || '';
  if (room.isRecurring && room.recurrenceRule === 'DAILY') return `Daily · ${when}`;
  if (room.isRecurring && room.selectedDays?.length) return `${room.selectedDays.join(', ')} · ${when}`;
  if (room.oneTimeDate) return `${new Date(room.oneTimeDate).toLocaleDateString()} · ${when}`;
  return when;
}

export const PrayerOperationsCenterPage: React.FC<Props> = ({ onNavigate }) => {
  const { user, organization } = useAuth();
  const { query: opsSearch } = useOpsSearch();
  const {
    prayerRooms = [],
    liveSession,
    participants = [],
    raisedHands = [],
    prayerRequests = [],
    connectedNow,
    addToast,
    isDarkMode,
  } = useApp();

  const [filter, setFilter] = useState<Filter>('all');
  const [jordan, setJordan] = useState<JordanRoom[]>([]);
  const [jordanLoaded, setJordanLoaded] = useState(false);
  const [health, setHealth] = useState<ApiHealth | null | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [jordanCounts, setJordanCounts] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [lastBroadcast, setLastBroadcast] = useState<{ text: string; at: string; room: string } | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const actor = { userId: user?.id, organizationId: organization?.id };
    const staffRooms = sanctumApi.jordanRooms(actor).catch(() => null);
    const [fromStaff, h] = await Promise.all([staffRooms, fetchHealth()]);
    if (fromStaff && fromStaff.rooms.length) {
      setJordan(fromStaff.rooms);
      setJordanCounts(fromStaff.counts);
    } else {
      setJordan(await fetchJordanRooms());
      setJordanCounts(false);
    }
    setJordanLoaded(true);
    setHealth(h);
    setRefreshing(false);
  }, [user?.id, organization?.id]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const role = user?.role || 'LISTENER';
  const caps = ROLE_CAPABILITIES[role];
  const firstName = user?.name?.split(' ')[0] || 'Pastor';

  const activeRooms = prayerRooms.filter((room) => !room.isArchived);
  const sessionLive = Boolean(liveSession && LIVE_STATES.has(String(liveSession.status)));
  const sessionWaiting = liveSession?.status === 'WAITING';
  const listeners = participants.filter((p) => !p.leftAt);
  const listenerCount = sessionLive || sessionWaiting ? Math.max(connectedNow || 0, listeners.length) : 0;
  const waitingHands = raisedHands.filter((h) => h.status === 'WAITING');
  const pendingRequests = prayerRequests.filter((r) => r.status === 'PENDING');
  const liveRoomId = sessionLive || sessionWaiting ? liveSession?.prayerRoomId : undefined;
  const liveRoom = activeRooms.find((room) => room.id === liveRoomId);
  const overflowRoom = activeRooms.find((room) => !room.isTestRoom && roomKind(room) === 'overflow') || activeRooms[0];

  const rows: Row[] = useMemo(() => {
    const jordanRows: Row[] = jordan.map((room) => ({
      key: `jordan-${room.id}`,
      name: room.name,
      where: 'Main prayer room · Jordan',
      kind: 'main',
      live: room.live,
      waiting: false,
      people: typeof room.count === 'number' ? room.count : null,
      capacity: room.capacity || 50,
      hands: null,
      thumb: '/prayer-room/room-thumb-1.webp',
      copyLink: jordanRoomUrl(room.id, room.live),
      monitor: () => window.open(jordanRoomUrl(room.id, room.live), '_blank', 'noopener,noreferrer'),
    }));
    const sanctumRows: Row[] = activeRooms.map((room) => {
      const isThis = room.id === liveRoomId;
      return {
        key: room.id,
        name: room.name,
        where: `${room.isTestRoom ? 'Test room' : 'Overflow room'} · Sanctum`,
        kind: roomKind(room),
        live: isThis && sessionLive,
        waiting: isThis && sessionWaiting,
        people: isThis ? listenerCount : null,
        capacity: room.expectedAttendance || null,
        hands: isThis ? waitingHands.length : null,
        schedule: scheduleLabel(room),
        monitor: () => window.open(`/join/${room.slug}`, '_blank', 'noopener,noreferrer'),
        manage: () => onNavigate(`/dashboard/prayer-rooms/${room.id}/control`),
        manageLabel: 'Manage',
        thumb: roomKind(room) === 'restricted' ? '/prayer-room/room-thumb-3.webp' : '/prayer-room/room-thumb-2.webp',
        copyLink: `${window.location.origin}/join/${room.slug}`,
      };
    });
    const all = [...jordanRows, ...sanctumRows];
    all.sort((a, b) => Number(b.live) - Number(a.live) || Number(b.waiting) - Number(a.waiting));
    return all;
  }, [jordan, activeRooms, liveRoomId, sessionLive, sessionWaiting, listenerCount, waitingHands.length, onNavigate]);

  const liveCount = rows.filter((r) => r.live).length;
  const jordanPeople = jordanCounts ? jordan.reduce((sum, r) => sum + (r.count || 0), 0) : 0;
  const sanctumSessionId = sessionLive || sessionWaiting ? liveSession?.id : undefined;

  const sendBroadcast = async () => {
    const text = broadcastText.trim();
    if (!text || !sanctumSessionId || broadcastSending) return;
    setBroadcastSending(true);
    try {
      const result = await sanctumApi.broadcast(sanctumSessionId, text, { userId: user?.id, organizationId: organization?.id });
      setLastBroadcast({ text, at: result.timestamp, room: result.roomName });
      setBroadcastText('');
      setBroadcastOpen(false);
      addToast(`Sent to everyone in ${result.roomName}.`, 'success');
    } catch (error: any) {
      addToast(error?.message || 'Could not send the message.', 'error');
    } finally {
      setBroadcastSending(false);
    }
  };
  const isFull = (r: Row) => r.live && r.capacity !== null && r.people !== null && r.people >= r.capacity;
  const fullCount = rows.filter(isFull).length;
  const scheduledCount = rows.filter((r) => !r.live && !r.waiting).length;
  const search = opsSearch.trim().toLowerCase();
  const shown = rows
    .filter((r) =>
      filter === 'live' ? r.live || r.waiting : filter === 'full' ? isFull(r) : filter === 'scheduled' ? !r.live && !r.waiting : true
    )
    .filter((r) => !search || `${r.name} ${r.where} ${KIND_LABEL[r.kind]}`.toLowerCase().includes(search));
  const roleShort =
    role === 'OWNER' ? 'Senior Pastor' : role === 'ADMIN' ? 'Administrator' : role === 'TECHNICAL_ADMIN' ? 'Technical Admin' : 'Moderator';

  const activity = useMemo(() => {
    const items: { id: string; icon: React.ElementType; text: string; at: string }[] = [];
    for (const h of raisedHands.slice(-6)) {
      items.push({ id: `h-${h.id}`, icon: Hand, text: `${h.displayName} raised a hand`, at: h.raisedAt });
    }
    for (const p of listeners.slice(-6)) {
      items.push({ id: `p-${p.id}`, icon: UserPlus, text: `${p.displayName} joined`, at: p.joinedAt });
    }
    for (const r of prayerRequests.slice(0, 6)) {
      items.push({
        id: `r-${r.id}`,
        icon: FileText,
        text: `Prayer request${r.roomName ? ` · ${r.roomName}` : ''}`,
        at: r.createdAt,
      });
    }
    return items
      .filter((item) => item.at)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 5);
  }, [raisedHands, listeners, prayerRequests]);

  const permissions = caps
    ? [
        { label: 'Monitor authorized rooms', ok: true },
        { label: 'Manage participants', ok: caps.canMuteSpeakers },
        { label: 'Approve requests to speak', ok: caps.canInviteSpeakers },
        { label: 'Mute / Remove participants', ok: caps.canMuteSpeakers },
        { label: 'Lock / End sessions', ok: caps.canEndSessions },
        { label: 'Create and edit rooms', ok: caps.canManageRooms },
        { label: 'Read private prayer requests', ok: caps.canViewPrivateRequests },
        { label: 'View reports & audit logs', ok: caps.canMuteSpeakers },
      ]
    : [];

  const openControl = () => {
    const target = liveRoom || overflowRoom;
    if (target) onNavigate(`/dashboard/prayer-rooms/${target.id}/control`);
    else onNavigate('/dashboard/prayer-rooms/new');
  };

  return (
    <div className="space-y-5" data-tour="dashboard-welcome">
      {/* Hero */}
      <section className="ops-hero">
        <img src="/prayer-room/ops-hero.webp" alt="" aria-hidden className="ops-hero-art" />
        <div className="ops-hero-inner">
          <div className="min-w-0">
            <p className="ops-hero-eyebrow">PLCC Sanctum</p>
            <h1 className="ops-hero-title">Prayer Operations Center</h1>
            <p className="ops-hero-sub">Monitor • Support • Manage • Overflow Prayer Rooms</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button type="button" onClick={openControl} className="ops-hero-btn">
              <Headphones className="h-5 w-5" aria-hidden />
              {liveRoom ? 'Moderator Control Room' : 'Moderator Control Room'}
              <Lock className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat
          tone="green"
          icon={Radio}
          label="Active Rooms"
          value={liveCount}
          note={`${liveCount} Live${fullCount ? ` • ${fullCount} Full` : ''} • ${rows.length} total`}
        />
        <Stat
          tone="gold"
          icon={Headphones}
          label="Listeners"
          value={listenerCount + jordanPeople}
          note={
            jordanCounts
              ? `${jordanPeople} in Jordan · ${listenerCount} in Sanctum`
              : sessionLive || sessionWaiting
                ? `in ${liveRoom?.name || 'the Sanctum room'}`
                : 'No one in Sanctum right now'
          }
        />
        <Stat
          tone="plain"
          icon={Hand}
          label="Raised Hands"
          value={waitingHands.length}
          note={waitingHands.length ? 'Awaiting approval' : 'None waiting'}
          onClick={liveRoom ? openControl : undefined}
        />
        <section className="ops-profile">
          <span className="ops-profile-avatar">{(user?.name || 'M').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-ink lg:text-lg">{user?.name || 'Moderator'}</p>
            <span className="ops-role-pill">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
              {roleShort}
            </span>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2f9d5c]" aria-hidden /> Online
            </p>
          </div>
        </section>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="min-w-0 space-y-5">
          {/* Live Prayer Rooms */}
          <section id="ops-rooms" className="scroll-mt-4 overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
            <header className="flex flex-col gap-3 bg-[#0f3d2c] px-5 py-3.5 text-[#f6f1e6] sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2.5 text-lg font-bold lg:text-xl">
                <Radio className="h-6 w-6 text-[#f1d58a]" aria-hidden />
                Live Prayer Rooms
              </h2>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(
                  [
                    ['all', `All Rooms (${rows.length})`],
                    ['live', `Live (${liveCount})`],
                    ['full', `Full (${fullCount})`],
                    ['scheduled', `Scheduled (${scheduledCount})`],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={cn(
                      'shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition lg:text-sm',
                      filter === value ? 'bg-gradient-to-b from-[#f1d58a] to-[#d9b45e] text-[#1d2414]' : 'bg-white/10 text-[#f6f1e6] hover:bg-white/15'
                    )}
                  >
                    {label}
                  </button>
                ))}
                <button type="button" onClick={() => void refresh()} aria-label="Refresh rooms" className="ml-1 shrink-0 cursor-pointer rounded-full p-2 text-[#f6f1e6] hover:bg-white/10">
                  <RefreshCw className={cn('h-5 w-5', refreshing && 'animate-spin')} />
                </button>
              </div>
            </header>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[52rem] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[13px] font-bold text-ink">
                    <th className="px-4 py-3">Room Name</th>
                    <th className="px-3 py-3">Room Type</th>
                    <th className="px-3 py-3">Participants</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Raised Hands</th>
                    <th className="px-4 py-3 text-center">Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((row) => (
                    <tr key={row.key} className="border-b border-line last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={row.thumb} alt="" aria-hidden className="h-11 w-16 shrink-0 rounded-lg object-cover" />
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-bold text-ink">{row.name}</p>
                            <p className="truncate text-xs text-muted">{row.where}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3"><KindPill kind={row.kind} /></td>
                      <td className="px-3 py-3 text-ink"><PeopleCount row={row} /></td>
                      <td className="px-3 py-3"><StatusPill row={row} /></td>
                      <td className="px-3 py-3 text-ink"><HandsCount row={row} /></td>
                      <td className="px-4 py-3"><RowControls row={row} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-line md:hidden">
              {shown.map((row) => (
                <li key={row.key} className="space-y-3 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <img src={row.thumb} alt="" aria-hidden className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink">{row.name}</p>
                      <p className="text-xs text-muted">{row.where}</p>
                    </div>
                    <StatusPill row={row} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink">
                    <KindPill kind={row.kind} />
                    <PeopleCount row={row} />
                    <HandsCount row={row} />
                  </div>
                  <RowControls row={row} full />
                </li>
              ))}
            </ul>

            {shown.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-muted">
                {search
                  ? 'No room matches your search.'
                  : filter === 'live'
                    ? 'No room is live right now.'
                    : filter === 'full'
                      ? 'No room is full.'
                      : !jordanLoaded
                        ? 'Loading rooms…'
                        : 'No prayer rooms yet. Create one to open the overflow.'}
              </div>
            )}
            <p className="border-t border-line px-5 py-3 text-[12px] text-muted">
              Jordan rooms hold up to 50 people. When one fills, open the Sanctum overflow room.
              {jordan.length && !jordanCounts ? ' Headcounts for Jordan rooms need SANCTUM_SERVICE_KEY on both servers.' : ''}
            </p>
          </section>

          {/* Quick actions */}
          <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#0f3d2c] dark:text-[#f1d58a]">
              <Zap className="h-5 w-5" aria-hidden />
              Quick Actions <span className="text-sm font-semibold text-muted">(Moderator)</span>
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
              <Action icon={PlusCircle} label="Create Prayer Room" onClick={() => onNavigate('/dashboard/prayer-rooms/new')} />
              <Action
                icon={Radio}
                label="Open Overflow Room"
                onClick={() => (overflowRoom ? onNavigate(`/dashboard/prayer-rooms/${overflowRoom.id}/control`) : onNavigate('/dashboard/prayer-rooms/new'))}
              />
              <Action icon={Megaphone} label="Broadcast Message" onClick={() => setBroadcastOpen(true)} />
              <Action icon={ShieldAlert} label="View Reports" onClick={() => window.open(PLCC_ONE_URL, '_blank', 'noopener,noreferrer')} />
              <Action icon={ScrollText} label="Audit Log" onClick={() => onNavigate('/dashboard/audit')} />
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                  <Clock className="h-5 w-5" aria-hidden />
                  Recent Activity
                </h2>
                <button type="button" onClick={() => onNavigate('/dashboard/audit')} className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-ink hover:underline">
                  View All Activity <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              {activity.length ? (
                <ul className="divide-y divide-line">
                  {activity.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id} className="flex items-center gap-3 py-2.5 text-[15px]">
                        <Icon className="h-5 w-5 shrink-0 text-[#c9a35a]" />
                        <span className="min-w-0 flex-1 truncate text-ink">{item.text}</span>
                        <span className="shrink-0 text-xs text-muted">{timeAgo(item.at)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted">Quiet for now. Activity from the live room shows here.</p>
              )}
            </section>

            <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
                <Activity className="h-5 w-5" aria-hidden />
                System Status
              </h2>
              <ul className="divide-y divide-line text-[15px]">
                <StatusLine label="Audio Service (LiveKit)" state={health === undefined ? 'checking' : health?.livekit === 'configured' ? 'ok' : 'down'} />
                <StatusLine label="Connection & Rooms" state={health === undefined ? 'checking' : health?.database === 'configured' ? 'ok' : 'down'} />
                <StatusLine label="Sign-in" state={health === undefined ? 'checking' : health?.clerk === 'unavailable' ? 'down' : health ? 'ok' : 'down'} />
                <StatusLine label="Jordan headcounts" state={!jordanLoaded ? 'checking' : jordanCounts ? 'ok' : 'off'} offLabel="Key not set" />
                <StatusLine label="Audio bridge (Jordan → Sanctum)" state="off" offLabel="Not set up yet" />
              </ul>
            </section>
          </div>
        </div>

        {/* Right rail */}
        <aside className="grid gap-5 md:grid-cols-2 xl:flex xl:flex-col">
          <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <ShieldCheck className="h-5 w-5" aria-hidden />
              Role & Access
            </h2>
            <ul className="mt-3 space-y-2.5 text-[15px]">
              {permissions.map((p) => (
                <li key={p.label} className={cn('flex items-start gap-2.5', p.ok ? 'text-ink' : 'text-muted line-through decoration-muted/40')}>
                  {p.ok ? <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2f7d4f]" /> : <X className="mt-0.5 h-5 w-5 shrink-0 text-muted" />}
                  {p.label}
                </li>
              ))}
            </ul>
            {caps?.canManageSettings ? (
              <button type="button" onClick={() => onNavigate('/dashboard/settings')} className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-1 text-sm font-bold text-[#0f3d2c] hover:underline dark:text-[#f1d58a]">
                Role Permissions Details <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </section>

          <a href={PLCC_ONE_URL} target="_blank" rel="noopener noreferrer" className="ops-incident">
            <ShieldAlert className="h-10 w-10 shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="block text-xl font-extrabold">Incident / Report</span>
              <span className="block text-sm">Safety • Conduct • Technical</span>
            </span>
          </a>
        </aside>
      </div>

      {broadcastOpen && createPortal(
        <div style={{ background: "rgba(8, 18, 13, 0.6)" }} className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4" onClick={() => setBroadcastOpen(false)}>
          <div
            role="dialog"
            data-staff
            data-staff-theme={isDarkMode ? 'dusk' : 'light'}
            aria-modal="true"
            aria-labelledby="broadcast-title"
            className="w-full max-w-lg rounded-t-3xl border border-line bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1d372c]">
                  <Megaphone className="h-5 w-5 text-[#e4c98f]" />
                </span>
                <div>
                  <h2 id="broadcast-title" className="text-lg font-bold text-ink">Broadcast message</h2>
                  <p className="text-xs text-muted">
                    {sanctumSessionId ? `To everyone in ${liveRoom?.name || liveSession?.roomName || 'the live room'}` : 'No Sanctum room is open'}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setBroadcastOpen(false)} aria-label="Close" className="cursor-pointer rounded-full p-2 text-muted hover:bg-black/5">
                <X className="h-4 w-4" />
              </button>
            </div>

            {sanctumSessionId ? (
              <>
                <textarea
                  autoFocus
                  rows={4}
                  maxLength={BROADCAST_MAX}
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="e.g. We will begin praying for the nations in 2 minutes. Stay with us."
                  className="mt-4 w-full resize-none rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-[#c9a35a]"
                />
                <div className="mt-1 flex justify-between text-[11px] text-muted">
                  <span>Shows as a banner in the room and stays in the room chat.</span>
                  <span>{broadcastText.length}/{BROADCAST_MAX}</span>
                </div>
                <div className="mt-4 flex gap-2.5">
                  <button type="button" onClick={() => setBroadcastOpen(false)} className="flex-1 cursor-pointer rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendBroadcast()}
                    disabled={!broadcastText.trim() || broadcastSending}
                    className="inline-flex flex-[2] cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1d372c] px-4 py-2.5 text-sm font-bold text-[#f6f1e6] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {broadcastSending ? 'Sending…' : 'Send to everyone'}
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-ink">
                  Broadcasts go to people in a live Sanctum room. Open the overflow first, then send your message.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBroadcastOpen(false);
                    if (overflowRoom) onNavigate(`/dashboard/prayer-rooms/${overflowRoom.id}/control`);
                  }}
                  className="w-full cursor-pointer rounded-xl bg-[#c9a35a] px-4 py-2.5 text-sm font-bold text-[#16251f]"
                >
                  Open the overflow room
                </button>
              </div>
            )}
            {lastBroadcast ? (
              <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
                Last sent {timeAgo(lastBroadcast.at)} to {lastBroadcast.room}: “{lastBroadcast.text}”
              </p>
            ) : null}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

function Stat({
  tone,
  icon: Icon,
  label,
  value,
  note,
  onClick,
}: {
  tone: 'green' | 'gold' | 'plain';
  icon: React.ElementType;
  label: string;
  value: number;
  note: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn('ops-stat', `is-${tone}`, onClick && 'is-clickable')}
    >
      <Icon className="ops-stat-icon" aria-hidden />
      <span className="min-w-0">
        <span className="block text-sm font-bold lg:text-lg">{label}</span>
        <span className="block text-3xl font-extrabold leading-tight tabular-nums lg:text-[2.6rem]">{value}</span>
        <span className="block truncate text-xs lg:text-sm">{note}</span>
      </span>
      <Users className="ops-stat-ghost" aria-hidden />
    </Tag>
  );
}

function KindPill({ kind }: { kind: Row['kind'] }) {
  return (
    <span className={cn('ops-kind', `is-${kind}`)}>
      {kind === 'restricted' ? <Lock className="h-3.5 w-3.5" aria-hidden /> : <span className="ops-kind-dot" aria-hidden />}
      {KIND_LABEL[kind]}
    </span>
  );
}

function StatusPill({ row }: { row: Row }) {
  if (row.live && row.capacity && row.people !== null && row.people >= row.capacity) {
    return <span className="ops-status is-full"><i aria-hidden />Full</span>;
  }
  if (row.live) return <span className="ops-status is-live"><i aria-hidden />Live</span>;
  if (row.waiting) return <span className="ops-status is-waiting"><i aria-hidden />Waiting room</span>;
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className="ops-status is-scheduled"><i aria-hidden />{row.schedule ? 'Scheduled' : 'Not live'}</span>
      {row.schedule ? <span className="whitespace-nowrap text-[11px] text-muted">{row.schedule}</span> : null}
    </span>
  );
}

function PeopleCount({ row }: { row: Row }) {
  if (row.people === null) {
    return row.kind === 'main' ? <span className="text-xs text-muted">Up to {row.capacity}</span> : <span className="text-muted">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[15px] tabular-nums">
      <Users className="h-5 w-5" aria-hidden />
      {row.people}
      {row.kind === 'main' && row.capacity ? <span> / {row.capacity}</span> : null}
    </span>
  );
}

function HandsCount({ row }: { row: Row }) {
  if (row.hands === null) return <span className="text-xs text-muted">{row.kind === 'main' ? 'In Jordan' : '—'}</span>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[15px]">
      <Hand className="h-5 w-5 text-[#c9a35a]" aria-hidden />
      {row.hands} {row.hands === 1 ? 'request' : 'requests'}
    </span>
  );
}

function RowControls({ row, full }: { row: Row; full?: boolean }) {
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className={cn('flex items-center gap-2', full ? 'w-full' : 'justify-center')}>
      <button type="button" onClick={row.monitor} className={cn('ops-btn is-green', full && 'flex-1')}>
        <Eye className="h-4 w-4" aria-hidden />
        {row.kind === 'main' ? (row.live ? 'Join' : 'Monitor') : 'Monitor'}
      </button>
      {row.manage ? (
        <button type="button" onClick={row.manage} className={cn('ops-btn is-gold', full && 'flex-1')}>
          <Settings2 className="h-4 w-4" aria-hidden />
          {row.manageLabel}
        </button>
      ) : (
        <span className={cn('ops-btn is-ghost', full && 'flex-1')} title="Jordan rooms are managed inside the Ka Link">
          <Settings2 className="h-4 w-4" aria-hidden />
          In Jordan
        </span>
      )}
      <div className="relative">
        <button type="button" onClick={() => setMenu((v) => !v)} className="ops-more" aria-label={`More for ${row.name}`} aria-expanded={menu}>
          <MoreVertical className="h-5 w-5" aria-hidden />
        </button>
        {menu ? (
          <div className="ops-more-menu" role="menu" onMouseLeave={() => setMenu(false)}>
            {row.copyLink ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  void navigator.clipboard?.writeText(row.copyLink!).then(() => setCopied(true));
                  window.setTimeout(() => {
                    setCopied(false);
                    setMenu(false);
                  }, 1200);
                }}
              >
                <Copy className="h-4 w-4" aria-hidden /> {copied ? 'Link copied' : 'Copy room link'}
              </button>
            ) : null}
            <button type="button" role="menuitem" onClick={() => { setMenu(false); row.monitor(); }}>
              <ExternalLink className="h-4 w-4" aria-hidden /> Open in a new tab
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Action({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ops-action">
      <Icon className="h-6 w-6 shrink-0" aria-hidden />
      {label}
    </button>
  );
}

function StatusLine({
  label,
  state,
  downLabel = 'Unavailable',
  offLabel = 'Off',
}: {
  label: string;
  state: 'ok' | 'down' | 'off' | 'checking';
  downLabel?: string;
  offLabel?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex items-center gap-2.5 text-ink">
        {state === 'ok' ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 fill-[#2f9d5c] text-white" aria-hidden />
        ) : (
          <span className={cn('h-3 w-3 shrink-0 rounded-full', state === 'down' ? 'bg-[#c4352d]' : state === 'off' ? 'bg-muted/40' : 'animate-pulse bg-muted/40')} />
        )}
        {label}
      </span>
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold',
          state === 'ok'
            ? 'bg-[#2f9d5c]/15 text-[#1f6e3f] dark:text-[#9fd8b5]'
            : state === 'down'
              ? 'bg-[#c4352d]/10 text-[#9c2a23] dark:text-[#ffb4ad]'
              : 'bg-black/5 text-muted'
        )}
      >
        {state === 'ok' ? 'Operational' : state === 'down' ? downLabel : state === 'off' ? offLabel : 'Checking…'}
      </span>
    </li>
  );
}
