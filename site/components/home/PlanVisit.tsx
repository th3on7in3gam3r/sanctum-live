import Link from 'next/link';
import { church } from '@/lib/church';
import { directionsUrl } from '@/components/home/Hero';
import { Reveal } from '@/components/home/Reveal';
import { SocialIcons } from '@/components/SocialIcons';

export function PlanVisit({ points, image }: { points: string[]; image: string }) {
  return (
    <section className="bg-forest-900 px-4 py-24 text-on-dark sm:px-6">
      <Reveal className="mx-auto flex max-w-6xl flex-col gap-12">
        <div className="grid items-stretch gap-12 min-[900px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div
            role="img"
            aria-label="Inside the sanctuary"
            className="min-h-[360px] rounded-[28px] bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(180deg, rgba(13,26,20,0.08), rgba(13,26,20,0.5)), url(${image})` }}
          />
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold tracking-[0.22em] text-gold">PLAN YOUR FIRST VISIT</p>
            <h2 className="font-display mt-5 text-[clamp(36px,4vw,54px)] font-light leading-[1.08] text-cream">
              We&rsquo;ve saved you a <em className="italic text-gold-light">seat.</em>
            </h2>
            {points.length ? (
              <ol className="mt-8 grid gap-x-7 gap-y-4 min-[600px]:grid-cols-2">
                {points.map((point, i) => (
                  <li key={point} className="flex gap-3 text-[16px] leading-relaxed text-sand">
                    <span className="font-extrabold text-gold">{String(i + 1).padStart(2, '0')}</span>
                    {point}
                  </li>
                ))}
              </ol>
            ) : null}
            <div className="mt-9 flex flex-wrap gap-3.5">
              <Link href="/visit" className="site-button min-h-[52px] bg-gold px-7 text-[16px] font-extrabold text-ink">Let us know you&rsquo;re coming</Link>
              <a href={directionsUrl()} className="site-button min-h-[52px] border border-sand/50 px-7 text-[16px] font-bold text-cream">Get directions</a>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-5 rounded-[26px] border border-gold/40 bg-forest-950/60 p-6 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between sm:p-7">
          <div>
            <p className="text-[17px] font-semibold text-cream">{church.address}</p>
            <p className="mt-1 text-[15px] text-muted-dark">
              <a href={church.phones[0].href} className="hover:underline">{church.phones[0].label}</a>
              {' · '}
              <a href={`mailto:${church.email}`} className="hover:underline">{church.email}</a>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <SocialIcons />
            <a href={church.whatsapp} className="site-button border border-sand/40 text-on-dark">Message us on WhatsApp</a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
