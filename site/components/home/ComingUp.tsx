import Link from 'next/link';
import { formatKampala } from '@/lib/format';
import type { PublicEvent } from '@/lib/api';
import { Reveal } from '@/components/home/Reveal';

export function ComingUp({ events }: { events: PublicEvent[] }) {
  return (
    <section className="bg-cream px-4 py-20 text-ink sm:px-6">
      <Reveal className="mx-auto max-w-6xl">
        <h2 className="font-display text-5xl font-light">Coming up</h2>
        <ul className="mt-8 divide-y divide-ink/15 border-y border-ink/15">
          {events.map((event) => {
            const day = formatKampala(event.startsAt, { day: 'numeric' });
            const month = formatKampala(event.startsAt, { month: 'short' });
            const weekday = formatKampala(event.startsAt, { weekday: 'long' });
            const time = formatKampala(event.startsAt, { hour: 'numeric', minute: '2-digit' });
            return (
              <li key={event.id} className="grid items-center gap-4 py-6 min-[900px]:grid-cols-[7rem_1fr_auto]">
                <p>
                  <span className="font-display block text-[64px] leading-none">{day}</span>
                  <span className="text-sm text-gold-ink">{month} · {weekday}</span>
                </p>
                <div>
                  <p className="font-display text-[30px] leading-tight">{event.title}</p>
                  <p className="mt-1 text-ink/70">{time} · {event.location}</p>
                </div>
                <Link
                  href={`/events/${event.id}`}
                  className={event.rsvpEnabled ? 'site-button bg-forest-900 text-on-dark' : 'site-button border border-ink text-ink'}
                >
                  {event.rsvpEnabled ? 'RSVP' : 'Details'}
                </Link>
              </li>
            );
          })}
        </ul>
        {events.length === 0 ? <p className="mt-6">The next gatherings will be posted here.</p> : null}
      </Reveal>
    </section>
  );
}
