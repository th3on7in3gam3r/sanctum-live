import Link from 'next/link';
import { church } from '@/lib/church';
import type { ServiceTime } from '@/lib/home';
import { GlowPhoto } from '@/components/GlowPhoto';

function LiveDot() {
  return <span className="inline-block h-2 w-2 rounded-full bg-live" aria-hidden="true" />;
}

export function Hero({
  lead,
  times,
  strip,
  hero,
  prayerUrl,
}: {
  lead: string;
  times: ServiceTime[];
  strip: string[];
  hero: string;
  prayerUrl: string;
}) {
  return (
    <section className="relative min-h-[880px] overflow-hidden bg-forest-900 text-on-dark">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 88% 8%, rgba(201,163,90,0.28), transparent 36%), linear-gradient(180deg, #1d372c 0%, #12231c 48%, #0d1a14 100%)' }}
      />
      <div className="relative mx-auto grid min-h-[880px] max-w-6xl items-center gap-10 px-4 pb-28 pt-32 sm:px-6 min-[900px]:grid-cols-2">
        <div>
          <p className="eyebrow">A Pentecostal family in Kampala</p>
          <h1 className="font-display mt-5 max-w-xl text-[clamp(52px,7.4vw,108px)] font-light leading-[0.92] tracking-[-0.035em]">
            Come home to the <em className="italic text-gold-light">land of promise.</em>
          </h1>
          {lead ? <p className="mt-6 max-w-md text-lg leading-relaxed text-sand">{lead}</p> : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/visit" className="site-button bg-gold text-ink">Plan your visit</Link>
            <a href={prayerUrl} className="site-button border border-sand text-on-dark">
              <LiveDot /> Join live prayer
            </a>
          </div>
        </div>
        <GlowPhoto
          src={hero}
          alt=""
          priority
          sizes="(min-width: 900px) 40vw, 100vw"
          className="min-h-[420px] rounded-t-[300px] border border-gold/80 min-[900px]:min-h-[620px]"
        />
      </div>
      <div className="relative border-t border-gold/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
          <p className="font-display text-[26px] leading-snug text-sand">
            {(strip.length ? strip : times.map((item) => item.name)).join(' · ')}
          </p>
          <p className="text-sm text-muted-dark">{church.address}</p>
        </div>
      </div>
    </section>
  );
}
