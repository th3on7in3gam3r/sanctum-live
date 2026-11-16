import React, { useEffect, useMemo, useState } from 'react';
import { FileText, History, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sanctumApi } from '../services/api/sanctumApi';
import { cn } from '../lib/utils';

type AuditEvent = { id: string; action: string; actorName: string | null; roomName: string | null; targetName: string | null; createdAt: string };

/** Plain-English wording for each audit action. */
const ACTION_TEXT: Record<string, (e: AuditEvent) => string> = {
  ROOM_CREATED: (e) => `created the prayer room ${e.targetName || ''}`.trim(),
  ROOM_UPDATED: (e) => `changed the settings of ${e.targetName || 'a prayer room'}`,
  ROOM_ARCHIVED: (e) => `archived ${e.targetName || 'a prayer room'}`,
  SESSION_STARTED: () => 'started a prayer session',
  SESSION_ENDED: () => 'ended a prayer session',
  SESSION_CANCELLED: () => 'cancelled a prayer session',
  PARTICIPANT_JOINED: (e) => `${e.targetName ? `let ${e.targetName} in` : 'joined'}`,
  PARTICIPANT_REMOVED: (e) => `removed ${e.targetName || 'a participant'} from the room`,
  HAND_RAISED: () => 'raised a hand',
  SPEAKER_INVITED: (e) => `invited ${e.targetName || 'someone'} to pray aloud`,
  SPEAKER_GRANTED: (e) => `gave ${e.targetName || 'someone'} the microphone`,
  SPEAKER_REVOKED: (e) => `took the microphone back from ${e.targetName || 'someone'}`,
  SPEAKER_TRANSFERRED: (e) => `passed the microphone to ${e.targetName || 'someone'}`,
  ROLE_CHANGED: (e) => `changed ${e.targetName ? `${e.targetName}'s` : 'a'} role`,
};

const IMPACT: Record<string, 'Routine' | 'Review' | 'High impact'> = {
  PARTICIPANT_REMOVED: 'High impact',
  ROOM_ARCHIVED: 'High impact',
  ROLE_CHANGED: 'High impact',
  SESSION_CANCELLED: 'Review',
  SPEAKER_REVOKED: 'Review',
  ROOM_UPDATED: 'Review',
};

function describe(e: AuditEvent) {
  const fn = ACTION_TEXT[e.action];
  if (fn) return fn(e);
  if (e.action.startsWith('CMS_')) return 'changed church website content';
  if (e.action.startsWith('ALBUM_') || e.action.startsWith('PHOTO_') || e.action === 'VIDEO_ADDED') return 'updated the photo gallery';
  return e.action.toLowerCase().replace(/_/g, ' ');
}

export const AuditLogPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user, organization } = useAuth();
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await sanctumApi.auditEvents({ userId: user?.id, organizationId: organization?.id });
      setEvents(result.events);
    } catch (err: any) {
      setError(err?.message || 'Could not load the audit log.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [organization?.id]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (events || []).filter((e) =>
      !q || [e.actorName, e.roomName, e.targetName, describe(e)].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [events, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#8a6a2e]">Moderator</p>
          <h1 className="font-display mt-1 text-3xl text-ink">Audit Log</h1>
          <p className="mt-1 text-sm text-muted">Every moderator action in your prayer rooms, newest first.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onNavigate('/dashboard/history')} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2 text-sm font-semibold text-ink">
            <History className="h-4 w-4" /> Session history
          </button>
          <button type="button" onClick={() => void load()} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1d372c] px-3.5 py-2 text-sm font-bold text-white">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 rounded-2xl border border-line bg-card px-4 py-2.5">
        <Search className="h-4 w-4 text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by person or room" className="w-full bg-transparent text-sm text-ink outline-none" />
      </label>

      <section className="overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
        {error ? <p className="px-5 py-4 text-sm text-danger">{error}</p> : null}
        {events === null ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Loading…</p>
        ) : shown.length ? (
          <ul className="divide-y divide-line">
            {shown.map((e) => {
              const impact = IMPACT[e.action] || 'Routine';
              return (
                <li key={e.id} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4">
                  <FileText className="hidden h-4 w-4 shrink-0 text-[#c9a35a] sm:block" />
                  <p className="min-w-0 flex-1 text-sm text-ink">
                    <strong>{e.actorName || 'Someone'}</strong> {describe(e)}
                    {e.roomName ? <span className="text-muted"> · {e.roomName}</span> : null}
                  </p>
                  <span
                    className={cn(
                      'w-fit shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                      impact === 'High impact' ? 'bg-[#c4352d]/10 text-[#9c2a23]' : impact === 'Review' ? 'bg-[#c9a35a]/20 text-[#7a5a22]' : 'bg-black/5 text-muted'
                    )}
                  >
                    {impact}
                  </span>
                  <time className="shrink-0 text-xs text-muted" dateTime={e.createdAt}>
                    {new Date(e.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-muted">{query ? 'Nothing matches that search.' : 'No moderator actions recorded yet.'}</p>
        )}
      </section>
    </div>
  );
};
