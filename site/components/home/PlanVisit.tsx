import Link from 'next/link';
import { church } from '@/lib/church';
import { GlowPhoto } from '@/components/GlowPhoto';
import { Reveal } from '@/components/home/Reveal';

export function PlanVisit({ points, photo }: { points: string[]; photo?: string | null }) {
  return (
    <section className="relative overflow-hidden bg-forest-900 px-4 py-20 text-on-dark sm:px-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 85% 20%, rgba(201,163,90,0.22), transparent 40%)' }}
      />
      <Reveal className="relative mx-auto grid max-w-6xl items-center gap-12 min-[900px]:grid-cols-2">
        <div>
          <h2 className="font-display text-5xl font-light leading-tight">
            We’ve saved you a <em className="italic text-gold-light">seat.</em>
          </h2>
          <ol className="mt-8 space-y-4">
            {points.map((point, index) => (
              <li key={point} className="grid grid-cols-[3rem_1fr] gap-3">
                <span className="font-display text-gold">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-sand">{point}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/visit" className="site-button bg-gold text-ink">Plan your visit</Link>
            <a href={church.whatsapp} className="site-button border border-sand text-on-dark">Message us on WhatsApp</a>
          </div>
        </div>
        <GlowPhoto src={photo} alt="" sizes="(min-width: 900px) 40vw, 100vw" className="min-h-[460px] rounded-t-[300px] border border-gold/70" />
      </Reveal>
    </section>
  );
}
