'use client';

/**
 * "Request a pastoral booking" — the form card (visitors don't need a PLCC account).
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

const label = 'block text-sm font-semibold text-ink';
const field =
  'mt-1.5 block w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-[15px] text-ink shadow-[inset_0_1px_2px_rgba(22,37,31,0.04)] placeholder:text-ink/35 transition focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/20';

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-3 font-display text-xl text-ink">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-900 font-sans text-xs font-bold text-gold-light">{n}</span>
      {children}
    </h3>
  );
}

export function BookingForm({ t, pick, onPick }: { t: Dict; pick: number; onPick: (i: number) => void }) {
  const f = t.footer.bookForm;
  const services = t.footer.services;
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
    if (fullName.trim().length < 2 || !phone.trim() || !email.trim()) {
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
      <div role="status" className="flex flex-col items-center px-4 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-900 text-gold-light" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <h3 className="mt-5 font-display text-2xl text-ink">{f.sentTitle}</h3>
        <p className="mt-2 max-w-sm text-ink/70">{f.sent}</p>
        <button type="button" onClick={() => setState('idle')} className="mt-6 text-sm font-semibold text-gold-ink underline underline-offset-4">
          {f.sendAnother}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate={false}>
      <StepTitle n={1}>{t.footer.bookPick}</StepTitle>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label={t.footer.bookPick}>
        {services.map((service, i) => {
          const on = pick === i;
          return (
            <button
              key={service}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onPick(i)}
              className={`flex min-h-12 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition ${
                on ? 'border-forest-900 bg-forest-900 text-cream shadow-sm' : 'border-ink/15 bg-white text-ink hover:border-gold'
              }`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${on ? 'border-gold bg-gold' : 'border-ink/30'}`} aria-hidden="true">
                {on && <span className="h-1.5 w-1.5 rounded-full bg-forest-900" />}
              </span>
              {service}
            </button>
          );
        })}
      </div>

      <div className="my-7 h-px bg-ink/10" />

      <StepTitle n={2}>{f.details}</StepTitle>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className={`${label} sm:col-span-2`}>
          {f.name}
          <input required minLength={2} maxLength={120} autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={field} />
        </label>
        <label className={label}>
          {f.phone}
          <input required type="tel" inputMode="tel" autoComplete="tel" placeholder="0772 123456" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
        </label>
        <label className={label}>
          {f.email}
          <input required type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        <p className="-mt-1.5 text-xs text-ink/55 sm:col-span-2">{f.contactHint}</p>
        <label className={`${label} ${offices.length > 1 ? '' : 'sm:col-span-2'}`}>
          {f.when}
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={field} />
        </label>
        {offices.length > 1 && (
          <label className={label}>
            {f.pastor}
            <select value={officeId} onChange={(e) => setOfficeId(e.target.value)} className={field}>
              <option value="">{f.anyPastor}</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>{o.pastorName}</option>
              ))}
            </select>
          </label>
        )}
        <label className={`${label} sm:col-span-2`}>
          {f.message}
          <textarea rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} className={`${field} resize-y`} />
          <span className="mt-1.5 block text-xs font-normal text-ink/55">{f.privacyHint}</span>
        </label>
      </div>

      {/* Hidden from people; bots fill it in. */}
      <label className="absolute left-[-9999px] h-px w-px overflow-hidden" aria-hidden="true">
        Website
        <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
      </label>

      {state === 'error' && error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-ink/60">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gold-ink" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          {f.privacyNote}
        </p>
        <button type="submit" disabled={state === 'sending'} className="site-button min-h-12 justify-center bg-forest-900 px-7 text-cream shadow-sm transition hover:bg-forest-800 disabled:opacity-60">
          {state === 'sending' ? f.sending : f.send}
        </button>
      </div>
    </form>
  );
}
