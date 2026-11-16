import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity,
  ArrowRight,
  CalendarClock,
  Check,
  ExternalLink,
  Eye,
  FileText,
  Hand,
  Headphones,
  History,
  Lock,
  Megaphone,
  MessageCircle,
  Send,
  Plus,
  Radio,
  RefreshCw,
  Settings2,
  ShieldAlert,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ROLE_CAPABILITIES } from '../lib/permissions';
import { fetchHealth, sanctumApi, type ApiHealth } from '../services/api/sanctumApi';
import { BROADCAST_MAX } from '../../shared/broadcast.ts';
import { fetchJordanRooms, JORDAN_ORIGIN, jordanRoomUrl, PLCC_ONE_URL, type JordanRoom } from '../lib/plccLinks';
import { cn } from '../lib/utils';
import type { PrayerRoom } from '../types';

interface Props {
  onNavigate: (path: string) => void;
}

type Filter = 'all' | 'live' | 'scheduled';

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
  const scheduledCount = rows.filter((r) => !r.live && !r.waiting).length;
  const shown = rows.filter((r) => (filter === 'live' ? r.live || r.waiting : filter === 'scheduled' ? !r.live && !r.waiting : true));

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
        { label: 'Watch prayer rooms', ok: true },
        { label: 'Approve requests to speak', ok: caps.canInviteSpeakers },
        { label: 'Mute and remove participants', ok: caps.canMuteSpeakers },
        { label: 'Start and end sessions', ok: caps.canEndSessions },
        { label: 'Create and edit rooms', ok: caps.canManageRooms },
        { label: 'Read private prayer requests', ok: caps.canViewPrivateRequests },
      ]
    : [];

  const openControl = () => {
    const target = liveRoom || overflowRoom;
    if (target) onNavigate(`/dashboard/prayer-rooms/${target.id}/control`);
    else onNavigate('/dashboard/prayer-rooms/new');
  };

  return (
    <div className="space-y-6" data-tour="dashboard-welcome">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#12231c] text-[#f6f1e6] shadow-lg">
        <img
          src="/brand/ops-banner.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-[85%] object-cover object-center opacity-95 sm:w-[62%]"
          style={{ WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 45%)', maskImage: 'linear-gradient(90deg, transparent 0%, #000 45%)' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[#12231c]/60 sm:hidden" />
        <div className="relative flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#e4c98f]">PLCC Sanctum</p>
            <h1 className="font-display mt-2 text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]">
              Prayer Operations Center
            </h1>
            <p className="mt-2 text-sm text-[#f6f1e6]/80">
              {greeting()}, {firstName}. Watch every prayer room, answer raised hands and open the overflow when Jordan fills up.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={openControl}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#c9a35a] px-5 py-2.5 text-sm font-bold text-[#16251f] shadow-md transition hover:bg-[#e4c98f]"
            >
              <Headphones className="h-4 w-4" />
              {liveRoom ? 'Open live control room' : 'Open control room'}
            </button>
            <button
              type="button"
              data-tour="dashboard-create-room"
              onClick={() => onNavigate('/dashboard/prayer-rooms/new')}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e4c98f]/50 px-4 py-2.5 text-sm font-semibold text-[#f6f1e6] transition hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              New room
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          tone="green"
          icon={Radio}
          label="Rooms live"
          value={liveCount}
          note={`${rows.length} room${rows.length === 1 ? '' : 's'} in total`}
        />
        <Stat
          tone="gold"
          icon={Headphones}
          label="Praying now"
          value={listenerCount + jordanPeople}
          note={
            jordanCounts
              ? `${jordanPeople} in Jordan · ${listenerCount} in Sanctum`
              : sessionLive
                ? `in ${liveRoom?.name || 'the Sanctum room'}`
                : sessionWaiting
                  ? 'in the Sanctum waiting room'
                  : 'No overflow open'
          }
        />
        <Stat
          tone="plain"
          icon={Hand}
          label="Raised hands"
          value={waitingHands.length}
          note={waitingHands.length ? 'Waiting for approval' : 'None waiting'}
          onClick={liveRoom ? openControl : undefined}
        />
        <Stat
          tone="plain"
          icon={FileText}
          label="Prayer requests"
          value={pendingRequests.length}
          note="Not yet answered"
          onClick={() => onNavigate('/dashboard/prayer-requests')}
        />
      </section>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {/* Rooms */}
          <section className="overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
            <header className="flex flex-col gap-3 bg-[#1d372c] px-5 py-4 text-[#f6f1e6] sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2.5 text-lg font-bold">
                <Radio className="h-5 w-5 text-[#e4c98f]" />
                Prayer rooms
              </h2>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(
                  [
                    ['all', `All (${rows.length})`],
                    ['live', `Live (${liveCount})`],
                    ['scheduled', `Scheduled (${scheduledCount})`],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={cn(
                      'shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                      filter === value ? 'bg-[#c9a35a] text-[#16251f]' : 'bg-white/10 text-[#f6f1e6] hover:bg-white/15'
                    )}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => void refresh()}
                  aria-label="Refresh rooms"
                  className="ml-1 shrink-0 cursor-pointer rounded-full p-2 text-[#f6f1e6] hover:bg-white/10"
                >
                  <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                </button>
              </div>
            </header>

            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                    <th className="px-5 py-3 w-[34%]">Room</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">People</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Hands</th>
                    <th className="px-5 py-3 text-right">Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((row) => (
                    <tr key={row.key} className="border-b border-line last:border-0">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-ink">{row.name}</p>
                        <p className="text-xs text-muted">{row.where}</p>
                      </td>
                      <td className="px-3 py-3.5"><KindPill kind={row.kind} /></td>
                      <td className="px-3 py-3.5 text-ink">
                        <PeopleCount row={row} />
                      </td>
                      <td className="px-3 py-3.5"><StatusPill row={row} /></td>
                      <td className="px-3 py-3.5 text-ink">
                        {row.hands === null ? <span className="text-muted">—</span> : (
                          <span className="inline-flex items-center gap-1.5">
                            <Hand className="h-4 w-4 text-[#c9a35a]" />
                            {row.hands}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <RowControls row={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phone cards */}
            <ul className="divide-y divide-line md:hidden">
              {shown.map((row) => (
                <li key={row.key} className="space-y-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-ink">{row.name}</p>
                      <p className="text-xs text-muted">{row.where}</p>
                    </div>
                    <StatusPill row={row} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink">
                    <KindPill kind={row.kind} />
                    <PeopleCount row={row} />
                    {row.hands ? (
                      <span className="inline-flex items-center gap-1"><Hand className="h-3.5 w-3.5 text-[#c9a35a]" />{row.hands}</span>
                    ) : null}
                  </div>
                  <RowControls row={row} full />
                </li>
              ))}
            </ul>

            {shown.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-muted">
                {filter === 'live'
                  ? 'No room is live right now.'
                  : !jordanLoaded
                    ? 'Loading rooms…'
                    : 'No prayer rooms yet. Create one to open the overflow.'}
              </div>
            )}
            <p className="border-t border-line px-5 py-3 text-[11px] text-muted">
              Jordan rooms hold up to 50 people. When one fills, start the Sanctum overflow and members are sent here.
              {jordan.length && !jordanCounts ? ' Headcounts for Jordan rooms need SANCTUM_SERVICE_KEY on both servers.' : ''}
            </p>
          </section>

          {/* Quick actions */}
          <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
              <Activity className="h-4 w-4 text-[#c9a35a]" />
              Quick actions
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
              <Action icon={Plus} label="Create room" onClick={() => onNavigate('/dashboard/prayer-rooms/new')} />
              <Action
                icon={Radio}
                label="Open overflow"
                onClick={() => (overflowRoom ? onNavigate(`/dashboard/prayer-rooms/${overflowRoom.id}/control`) : onNavigate('/dashboard/prayer-rooms/new'))}
              />
              <Action icon={Megaphone} label="Broadcast message" onClick={() => setBroadcastOpen(true)} />
              <Action icon={FileText} label="Prayer requests" onClick={() => onNavigate('/dashboard/prayer-requests')} />
              <Action icon={Users} label="Participants" onClick={() => onNavigate('/dashboard/participants')} />
              <Action icon={History} label="Session history" onClick={() => onNavigate('/dashboard/history')} />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent activity */}
            <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-ink">
                  <CalendarClock className="h-4 w-4 text-[#c9a35a]" />
                  Recent activity
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('/dashboard/history')}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-muted hover:text-ink"
                >
                  History <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {activity.length ? (
                <ul className="divide-y divide-line">
                  {activity.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
                        <Icon className="h-4 w-4 shrink-0 text-[#c9a35a]" />
                        <span className="min-w-0 flex-1 truncate text-ink">{item.text}</span>
                        <span className="shrink-0 text-xs text-muted">{timeAgo(item.at)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted">Quiet for now. Activity shows here during a session.</p>
              )}
            </section>

            {/* System status */}
            <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
                <Activity className="h-4 w-4 text-[#c9a35a]" />
                System status
              </h2>
              <ul className="divide-y divide-line text-sm">
                <StatusLine label="Audio service (LiveKit)" state={health === undefined ? 'checking' : health?.livekit === 'configured' ? 'ok' : 'down'} />
                <StatusLine label="Rooms & database" state={health === undefined ? 'checking' : health?.database === 'configured' ? 'ok' : 'down'} />
                <StatusLine label="Sign-in" state={health === undefined ? 'checking' : health?.clerk === 'unavailable' ? 'down' : health ? 'ok' : 'down'} />
                <StatusLine label="Jordan rooms" state={!jordanLoaded ? 'checking' : jordan.length ? 'ok' : 'down'} downLabel="Not reachable" />
              </ul>
            </section>
          </div>
        </div>

        {/* Right rail */}
        <aside className="grid gap-6 md:grid-cols-2 2xl:flex 2xl:flex-col">
          <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1d372c] text-base font-bold text-[#e4c98f]">
                {(user?.name || 'P').split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-ink">{user?.name || 'Moderator'}</p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#c9a35a]/20 px-2.5 py-0.5 text-[11px] font-bold text-ink">
                  <ShieldAlert className="h-3 w-3" />
                  {caps?.label || 'Moderator'}
                </span>
              </div>
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted">What you can do</p>
              <ul className="space-y-2 text-sm">
                {permissions.map((p) => (
                  <li key={p.label} className={cn('flex items-center gap-2.5', p.ok ? 'text-ink' : 'text-muted line-through decoration-muted/40')}>
                    {p.ok ? <Check className="h-4 w-4 shrink-0 text-[#3d8a5f]" /> : <X className="h-4 w-4 shrink-0 text-muted" />}
                    {p.label}
                  </li>
                ))}
              </ul>
              {caps?.canManageSettings ? (
                <button
                  type="button"
                  onClick={() => onNavigate('/dashboard/settings')}
                  className="mt-4 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-ink hover:underline"
                >
                  Team & roles <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Moderator guide</p>
            <ol className="mt-3 space-y-2.5 text-sm text-ink">
              <li className="flex gap-2.5"><Num n={1} />Jordan's main room fills at 50.</li>
              <li className="flex gap-2.5"><Num n={2} />Open the overflow and start the session.</li>
              <li className="flex gap-2.5"><Num n={3} />Everyone joins muted. Approve raised hands to let someone pray aloud.</li>
            </ol>
          </section>

          <a
            href={PLCC_ONE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-3xl border-2 border-[#b4413a]/40 bg-[#b4413a]/5 p-5 transition hover:bg-[#b4413a]/10"
          >
            <ShieldAlert className="h-8 w-8 shrink-0 text-[#b4413a]" />
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-[#b4413a]">Report a concern</span>
              <span className="block text-xs text-muted">Safety, conduct or a technical problem. Opens PLCC ONE.</span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-[#b4413a]" />
          </a>

          <a
            href={`${JORDAN_ORIGIN}/live`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-3xl border border-line bg-card p-5 shadow-sm transition hover:bg-black/[0.02]"
          >
            <MessageCircle className="h-6 w-6 shrink-0 text-[#c9a35a]" />
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink">Open Jordan live prayer</span>
              <span className="block text-xs text-muted">Join the main room as a member.</span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted" />
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

function Num({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c9a35a]/25 text-[11px] font-bold text-ink">
      {n}
    </span>
  );
}

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
      className={cn(
        'relative overflow-hidden rounded-3xl p-4 text-left shadow-sm sm:p-5',
        onClick && 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md',
        tone === 'green' && 'bg-[#1d372c] text-[#f6f1e6]',
        tone === 'gold' && 'bg-gradient-to-br from-[#f6e7c4] to-[#e4c98f] text-[#16251f]',
        tone === 'plain' && 'border border-line bg-card text-ink'
      )}
    >
      <Icon
        className={cn(
          'absolute -right-2 -bottom-2 h-16 w-16 opacity-15 sm:h-20 sm:w-20',
          tone === 'green' ? 'text-[#e4c98f]' : 'text-[#16251f]'
        )}
      />
      <p className="flex items-center gap-2 text-xs font-bold sm:text-sm">
        <Icon className={cn('h-4 w-4', tone === 'green' ? 'text-[#e4c98f]' : 'text-[#8a6a2e]')} />
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-extrabold tabular-nums sm:text-4xl">{value}</p>
      <p className={cn('mt-0.5 truncate text-[11px] sm:text-xs', tone === 'green' ? 'text-[#f6f1e6]/75' : 'opacity-70')}>{note}</p>
    </Tag>
  );
}

function KindPill({ kind }: { kind: Row['kind'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
        kind === 'main' && 'bg-[#3d8a5f]/15 text-[#245c3d] dark:text-[#9fd8b5]',
        kind === 'overflow' && 'bg-[#c9a35a]/20 text-[#7a5a22] dark:text-[#e4c98f]',
        kind === 'restricted' && 'bg-[#6b4fa8]/15 text-[#4d3585] dark:text-[#c7b6ee]',
        kind === 'test' && 'bg-black/5 text-muted'
      )}
    >
      {kind === 'restricted' ? <Lock className="h-3 w-3" /> : null}
      {KIND_LABEL[kind]}
    </span>
  );
}

function StatusPill({ row }: { row: Row }) {
  if (row.live && row.capacity && row.people !== null && row.people >= row.capacity) {
    return <Pill dot="bg-[#c4352d]" className="bg-[#c4352d]/12 text-[#9c2a23] dark:text-[#ffb4ad]">Full</Pill>;
  }
  if (row.live) return <Pill dot="bg-[#2f9d5c] animate-pulse" className="bg-[#2f9d5c]/12 text-[#1f6e3f] dark:text-[#9fd8b5]">Live</Pill>;
  if (row.waiting) return <Pill dot="bg-[#c9a35a]" className="bg-[#c9a35a]/20 text-[#7a5a22] dark:text-[#e4c98f]">Waiting room</Pill>;
  return (
    <span className="text-xs text-muted">{row.schedule || 'Not live'}</span>
  );
}

function Pill({ dot, className, children }: { dot: string; className: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold', className)}>
      <span className={cn('h-2 w-2 rounded-full', dot)} />
      {children}
    </span>
  );
}

function PeopleCount({ row }: { row: Row }) {
  if (row.people === null) {
    return row.kind === 'main' ? (
      <span className="text-xs text-muted">Up to {row.capacity}</span>
    ) : (
      <span className="text-muted">—</span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums">
      <Users className="h-4 w-4 text-muted" />
      {row.people}
      {row.capacity ? <span className="text-muted">/ {row.capacity}</span> : null}
    </span>
  );
}

function RowControls({ row, full }: { row: Row; full?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', full ? 'w-full' : 'justify-end')}>
      <button
        type="button"
        onClick={row.monitor}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1d372c] px-3.5 py-2 text-xs font-bold text-[#f6f1e6] transition hover:bg-[#12231c]',
          full && 'flex-1'
        )}
      >
        {row.kind === 'main' ? <ExternalLink className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {row.kind === 'main' ? (row.live ? 'Join in Jordan' : 'Open in Jordan') : 'Listen'}
      </button>
      {row.manage ? (
        <button
          type="button"
          onClick={row.manage}
          className={cn(
            'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#c9a35a] px-3.5 py-2 text-xs font-bold text-[#16251f] transition hover:bg-[#e4c98f]',
            full && 'flex-1'
          )}
        >
          <Settings2 className="h-3.5 w-3.5" />
          {row.manageLabel}
        </button>
      ) : null}
    </div>
  );
}

function Action({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-line bg-paper px-3.5 py-3 text-left text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-[#c9a35a] hover:shadow-sm"
    >
      <Icon className="h-5 w-5 shrink-0 text-[#8a6a2e] dark:text-[#e4c98f]" />
      {label}
    </button>
  );
}

function StatusLine({ label, state, downLabel = 'Unavailable' }: { label: string; state: 'ok' | 'down' | 'checking'; downLabel?: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex items-center gap-2.5 text-ink">
        <span
          className={cn(
            'h-2.5 w-2.5 rounded-full',
            state === 'ok' ? 'bg-[#2f9d5c]' : state === 'down' ? 'bg-[#c4352d]' : 'bg-muted/40 animate-pulse'
          )}
        />
        {label}
      </span>
      <span
        className={cn(
          'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
          state === 'ok' ? 'bg-[#2f9d5c]/12 text-[#1f6e3f] dark:text-[#9fd8b5]' : state === 'down' ? 'bg-[#c4352d]/10 text-[#9c2a23] dark:text-[#ffb4ad]' : 'text-muted'
        )}
      >
        {state === 'ok' ? 'Working' : state === 'down' ? downLabel : 'Checking…'}
      </span>
    </li>
  );
}
