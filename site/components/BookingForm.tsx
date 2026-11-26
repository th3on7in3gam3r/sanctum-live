'use client';

/**
 * "Request a pastoral booking" form for everyone (visitors don't need a PLCC account).
 * Sends to /api/pastoral-booking → PLCC Canaan's Pastor's Office, which alerts the
 * pastor and assistant (Canaan bell, phone alert, email).
 */
import { useEffect, useState } from 'react';
import type { Dict } from '@/lib/i18n';

type Office = { id: string; pastorName: string };
const SERVICE_KEYS = ['baptism', 'dedication', 'wedding', 'counseling', 'other'] as const;

export function serviceKey(index: number): (typeof SERVICE_KEYS)[number] {
  return SERVICE_KEYS[index] || 'other';
}

const field =
  'mt-1 block w-full rounded-xl border border-sand/30 bg-white/[0.06] px-3 py-2.5 text-on-dark placeholder:text-on-dark/40 focus:border-gold focus:outline-none';

export function BookingForm({ t, pick }: { t: Dict; pick: number }) {
  const f = t.footer.bookForm;
  const [offices, setOffices] = useState<Office[]>([]);
  const [officeId, setOfficeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [when, setWhen] = useState('');
  const [message, setMessage] = useState('');
  const [trap, setTrap] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/api/pastoral-booking')
      .then((r) => r.json())
      .then((d: { offices?: Office[] }) => {
        if (alive && Array.isArray(d.offices)) setOffices(d.offices);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() && !email.trim()) {
      setError(f.needContact);
      setState('error');
      return;
    }
    setState('sending');
    setError('');
    let preferredStart: string | undefined;
    if (when) {
      const d = new Date(when);
      if (Number.isFinite(d.getTime())) preferredStart = d.toISOString();
    }
    try {
      const r = await fetch('/api/pastoral-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          service: serviceKey(pick),
          phone: phone.trim(),
          email: email.trim(),
          preferredStart,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Kampala',
          officeId: officeId || undefined,
          message: message.trim(),
          website: trap,
        }),
      });
      const data = (await r.json().catch(() => null)) as { ok?: boolean; error?: string | null } | null;
      if (r.ok && data?.ok) {
        setState('sent');
        setFullName('');
        setPhone('');
        setEmail('');
        setWhen('');
        setMessage('');
        return;
      }
      setError((data?.error && String(data.error)) || f.error);
      setState('error');
    } catch {
      setError(f.error);
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <p role="status" className="mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-5 text-on-dark">
        {f.sent}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2" aria-labelledby="book-form-title">
      <p id="book-form-title" className="text-sm font-semibold text-sand sm:col-span-2">{f.title}</p>
      <label className="text-sm text-muted-dark sm:col-span-2">
        {f.name}
        <input required minLength={2} maxLength={120} autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={field} />
      </label>
      <label className="text-sm text-muted-dark">
        {f.phone}
        <input type="tel" inputMode="tel" autoComplete="tel" placeholder="0772 123456" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
      </label>
      <label className="text-sm text-muted-dark">
        {f.email}
        <input type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      </label>
      <p className="-mt-2 text-xs text-muted-dark sm:col-span-2">{f.contactHint}</p>
      <label className="text-sm text-muted-dark">
        {f.when}
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={field} />
      </label>
      {offices.length > 1 ? (
        <label className="text-sm text-muted-dark">
          {f.pastor}
          <select value={officeId} onChange={(e) => setOfficeId(e.target.value)} className={field}>
            <option value="">{f.anyPastor}</option>
            {offices.map((o) => (
              <option key={o.id} value={o.id}>{o.pastorName}</option>
            ))}
          </select>
        </label>
      ) : (
        <span className="hidden sm:block" />
      )}
      <label className="text-sm text-muted-dark sm:col-span-2">
        {f.message}
        <textarea rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} className={field} />
        <span className="mt-1 block text-xs">{f.privacyHint}</span>
      </label>
      {/* Hidden from people; bots fill it in. */}
      <label className="absolute left-[-9999px] h-px w-px overflow-hidden" aria-hidden="true">
        Website
        <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
      </label>
      {state === 'error' && error && (
        <p role="alert" className="rounded-xl bg-red-950/50 p-3 text-sm text-red-100 sm:col-span-2">{error}</p>
      )}
      <button type="submit" disabled={state === 'sending'} className="site-button justify-center bg-gold px-5 text-ink disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
        {state === 'sending' ? f.sending : f.send}
      </button>
    </form>
  );
}
