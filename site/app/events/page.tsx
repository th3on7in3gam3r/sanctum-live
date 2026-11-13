import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/page/PageHero';
import { PhotoTile } from '@/components/page/PhotoTile';
import { getPage, listEvents, listPublicGroups, listServiceTimes, type PublicEvent } from '@/lib/api';
import { clock } from '@/lib/schedule';
import { formatKampala } from '@/lib/format';
import { parseHome } from '@/lib/home';
import { getDictionary } from '@/lib/locale';
import { label, type Dict } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming gatherings at Promised Land Christian Center in Kampala.',
};

function monthParts(value: string) {
  return {
    month: formatKampala(value, { month: 'long' }),
    year: formatKampala(value, { year: 'numeric' }),
    key: formatKampala(value, { month: 'long', year: 'numeric' }),
  };
}

function EventRow({ event, numeral, t }: { event: PublicEvent; numeral: string; t: Dict }) {
  const weekday = formatKampala(event.startsAt, { weekday: 'short' });
  const time = formatKampala(event.startsAt, { hour: 'numeric', minute: '2-digit' });
  return (
    <li className="grid items-center gap-4 border-t border-ink/15 py-5 min-[900px]:grid-cols-[4rem_6rem_1fr_auto]">
      <p className="font-display text-3xl text-gold">{numeral}</p>
      <p className="text-gold-ink">{weekday}</p>
      <div>
        <p className="font-display text-3xl">{event.title}</p>
        <p className="text-ink/70">{time} · {event.location}</p>
        {event.prayerRoom ? <p className="mt-1 text-sm font-semibold text-gold-ink">{t.pages.events.alsoLive}</p> : null}
      </div>
      <Link href={`/events/${event.id}`} className={event.rsvpEnabled ? 'site-button bg-forest-900 text-on-dark' : 'site-button border border-ink text-ink'}>
        {event.rsvpEnabled ? t.messages.rsvp : t.messages.details}
      </Link>
    </li>
  );
}

export default async function EventsPage() {
  const { t } = await getDictionary();
  const e = t.pages.events;
  const [events, home, groups, serviceTimes] = await Promise.all([listEvents(), getPage('home'), listPublicGroups(), listServiceTimes()]);
  const huddles = groups.filter((group) => group.huddle);
  const times = serviceTimes.length
    ? serviceTimes.map((time) => ({ day: time.name, time: [clock(time), time.place, time.note].filter(Boolean).join(' · '), name: time.name, line: '' }))
    : home ? parseHome(home).times : [];
  const next = events[0];
  const rest = events.slice(1);
  const months: { key: string; month: string; year: string; events: PublicEvent[] }[] = [];
  for (const event of rest) {
    const parts = monthParts(event.startsAt);
    const group = months.find((item) => item.key === parts.key);
    if (group) group.events.push(event);
    else months.push({ ...parts, events: [event] });
  }

  return (
    <>
      <PageHero variant="overlap" eyebrow={label(t, 'Events')} title={e.titleA} accent={e.titleB} lede={e.lede} />
      {next ? (
        <article className="relative z-10 mx-auto -mt-24 grid max-w-6xl items-center gap-8 px-4 min-[900px]:grid-cols-2 sm:px-6">
          <div className="relative">
            <PhotoTile src={next.imageUrl} sizes="(min-width: 900px) 40vw, 100vw" className="min-h-[320px] rounded-[22px]" />
            <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-ink">{e.nextUp}</span>
          </div>
          <div className="rounded-[26px] bg-cream p-6 text-ink">
            <p className="font-display text-[72px] leading-none">{formatKampala(next.startsAt, { day: 'numeric' })}</p>
            <p className="text-gold-ink">{formatKampala(next.startsAt, { month: 'long' })} · {formatKampala(next.startsAt, { weekday: 'long' })}</p>
            <h2 className="font-display mt-4 text-4xl font-light">{next.title}</h2>
            <p className="mt-2">{formatKampala(next.startsAt, { hour: 'numeric', minute: '2-digit' })} · {next.location}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {next.rsvpEnabled ? <Link href={`/events/${next.id}#rsvp`} className="site-button bg-gold text-ink">{t.rsvp.heading}</Link> : null}
              <a href={`/events/${next.id}/calendar`} className="site-button border border-ink text-ink">{t.rsvp.calendar}</a>
            </div>
          </div>
        </article>
      ) : null}
      <section className="bg-cream px-4 py-16 text-ink sm:px-6">
        <div className="mx-auto max-w-6xl">
          {months.map((group) => (
            <div key={group.key} className="mt-10">
              <h2 className="font-display text-4xl font-light">{group.month} <span className="text-gold">{group.year}</span></h2>
              <ul className="mt-4">
                {group.events.map((event, index) => <EventRow key={event.id} event={event} numeral={String(index + 1).padStart(2, '0')} t={t} />)}
              </ul>
            </div>
          ))}
          {events.length === 0 ? <p>{e.none}</p> : null}
        </div>
      </section>
      <section className="bg-sand px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 min-[900px]:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="font-display text-4xl font-light text-ink">{e.everyWeek}</h2>
            {huddles.length ? (
              <ul className="mt-6 divide-y divide-ink/15">
                {huddles.map((group) => (
                  <li key={group.id} className="flex items-baseline justify-between gap-4 py-3 text-ink">
                    <span className="font-display text-2xl">{group.huddle?.name}</span>
                    <span>{group.huddle?.nextStartsAt ? formatKampala(group.huddle.nextStartsAt, { weekday: 'long', hour: 'numeric', minute: '2-digit' }) : group.meetingTime}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <ul className="mt-6 divide-y divide-ink/15">
              {times.map((item) => (
                <li key={item.name} className="flex items-baseline justify-between gap-4 py-3 text-ink">
                  <span className="font-display text-2xl">{item.name}</span>
                  <span>{item.time}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/huddles"
            className="relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[22px] bg-forest-950 p-6 text-on-dark"
            style={{ backgroundImage: "linear-gradient(180deg, transparent 35%, rgba(13,26,20,0.92) 78%), url('/live-huddles.jpg')", backgroundSize: 'cover', backgroundPosition: 'center top' }}
          >
            <p className="eyebrow">{e.midweek}</p>
            <p className="font-display mt-2 text-4xl">{e.liveHuddles}</p>
          </Link>
        </div>
      </section>
    </>
  );
}
