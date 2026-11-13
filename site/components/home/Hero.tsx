import type { Dict } from '@/lib/i18n';
import Link from 'next/link';
import { church } from '@/lib/church';
import { formatKampala } from '@/lib/format';
import type { PublicLive } from '@/lib/api';
import type { ScheduleItem } from '@/lib/schedule';

function LiveDot({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${on ? 'bg-live shadow-[0_0_0_5px_rgba(111,207,142,0.18)]' : 'bg-gold-light'}`}
      aria-hidden="true"
    />
  );
}

export function directionsUrl() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(church.mapsQuery)}`;
}

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

/** The card beside the headline: the next main service, live prayer status, and the way into PLCC ONE. */
function ThisWeekCard({ next, live, oneUrl, t }: { next: ScheduleItem | null; live: PublicLive | null; oneUrl: string; t: Dict }) {
  const liveRoom = live?.rooms?.find((room) => room.status === 'LIVE');
  const onAir = live?.status === 'LIVE' || Boolean(liveRoom);
  const prayerName = liveRoom?.name || live?.name || t.hero.prayerRoom;
  const when = live?.startsAt ? formatKampala(live.startsAt, { weekday: 'long', hour: 'numeric', minute: '2-digit' }) : null;

  return (
    <aside
      aria-label={t.hero.thisWeek}
      className="w-full max-w-[420px] rounded-[24px] border border-gold/45 bg-forest-950/80 p-6 backdrop-blur-sm sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-extrabold tracking-[0.2em] text-gold">{next?.day === 'SUN' ? t.hero.thisSunday : t.hero.thisWeek}</p>
        <p className="text-[13px] text-muted-dark">{t.hero.eat}</p>
      </div>
      {next ? (
        <div className="mt-4">
          <p className="font-display text-[32px] leading-tight text-cream">{next.name}</p>
          <p className="mt-1 text-[16px] text-sand">{[next.time, next.detail].filter(Boolean).join(' · ')}</p>
        </div>
      ) : null}
      <div className="my-5 h-px bg-on-dark/10" />
      <p className="flex items-center gap-3 text-[15px] text-sand">
        <LiveDot on={onAir} />
        {onAir ? (
          <span><strong className="text-cream">{prayerName}</strong> {t.hero.isLive}</span>
        ) : (
          <span><strong className="text-cream">{t.hero.nextPrayer}</strong> {when ? `${prayerName}, ${when}` : prayerName}</span>
        )}
      </p>
      <a href={oneUrl} className="site-button mt-5 w-full bg-gold-light font-extrabold text-ink">
        {onAir ? t.hero.joinLive : t.hero.stepIn}
      </a>
      <a href={directionsUrl()} className="mt-4 inline-block text-sm font-bold text-gold-light underline-offset-4 hover:underline">
        {church.address} · {t.hero.directions}
      </a>
    </aside>
  );
}

export function Hero({
  lead,
  next,
  live,
  oneUrl,
  image,
  t,
  translated,
}: {
  t: Dict;
  translated: boolean;
  lead: string;
  next: ScheduleItem | null;
  live: PublicLive | null;
  oneUrl: string;
  image: string;
}) {
  return (
    <section className="relative overflow-hidden bg-forest-950 text-on-dark">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-[position:center_42%]"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(13,26,20,0.75) 0%, rgba(13,26,20,0) 18%), ' +
            'linear-gradient(0deg, rgba(13,26,20,0.80) 0%, rgba(13,26,20,0) 42%), ' +
            'linear-gradient(100deg, rgba(13,26,20,0.77) 0%, rgba(13,26,20,0.50) 45%, rgba(13,26,20,0.19) 100%)',
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20 pt-32 sm:px-6 min-[900px]:flex-row min-[900px]:items-end min-[900px]:pb-24 min-[900px]:pt-44">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-extrabold tracking-[0.22em] text-gold-light [text-shadow:0_1px_12px_rgba(0,0,0,0.5)]">{t.hero.eyebrow}</p>
          <h1 className="font-display mt-6 max-w-2xl text-[clamp(48px,6.4vw,92px)] font-light leading-[0.98] tracking-[-0.03em] text-cream [text-shadow:0_2px_30px_rgba(0,0,0,0.45)]">
            {t.hero.titleA} <em className="italic text-gold-light">{t.hero.titleB}</em>
          </h1>
          <p className="mt-6 max-w-[520px] text-[19px] leading-relaxed text-sand [text-shadow:0_1px_14px_rgba(0,0,0,0.55)]">
            {/* The church's own lead line (Canaan) is English; other languages use the translated tagline. */}
            {translated ? t.hero.lead : lead || t.hero.lead}{' '}
            {t.hero.leadTail}
          </p>
          <div className="mt-9 flex flex-wrap gap-3.5">
            <Link href="/visit" className="site-button min-h-[52px] bg-gold px-7 text-[16px] font-extrabold text-ink">{t.hero.planVisit}</Link>
            <a href={oneUrl} className="site-button min-h-[52px] border border-sand/55 bg-forest-950/35 px-7 text-[16px] font-bold text-cream">
              {t.hero.stepIn} <Arrow />
            </a>
          </div>
        </div>
        <ThisWeekCard next={next} live={live} oneUrl={oneUrl} t={t} />
      </div>
    </section>
  );
}
