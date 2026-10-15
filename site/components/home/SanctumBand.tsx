import { formatKampala } from '@/lib/format';
import type { PublicLive } from '@/lib/api';
import { Reveal } from '@/components/home/Reveal';

export function SanctumBand({ live, prayerUrl }: { live: PublicLive | null; prayerUrl: string }) {
  const onAir = live?.status === 'LIVE';
  const when = live?.startsAt
    ? formatKampala(live.startsAt, { weekday: 'long', hour: 'numeric', minute: '2-digit' })
    : 'The next gathering will be posted here.';

  return (
    <section className="bg-gold px-4 py-16 text-ink sm:px-6">
      <Reveal className="mx-auto grid max-w-6xl items-center gap-8 min-[900px]:grid-cols-2">
        <h2 className="font-display text-5xl font-light leading-tight">Pray with the church, wherever you are.</h2>
        <div className="rounded-3xl bg-forest-950 p-6 text-on-dark">
          <p className={onAir ? 'text-sm font-semibold text-live' : 'text-sm font-semibold text-gold-light'}>
            {onAir ? 'Live now' : 'Next prayer'}
          </p>
          <p className="font-display mt-2 text-3xl">{live?.name || 'Prayer room'}</p>
          {!onAir ? <p className="mt-2 text-muted-dark">{when}</p> : null}
          <a href={prayerUrl} className="site-button mt-6 bg-gold text-ink">Join the prayer room</a>
        </div>
      </Reveal>
    </section>
  );
}
