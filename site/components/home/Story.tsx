import type { Dict } from '@/lib/i18n';
import Link from 'next/link';
import { Reveal } from '@/components/home/Reveal';

export function Story({ t }: { t: Dict }) {
  return (
    <section className="bg-[#efe7d6] px-4 py-24 text-ink sm:px-6">
      <Reveal className="mx-auto grid max-w-6xl gap-14 min-[900px]:grid-cols-2">
        <div>
          <p className="text-[13px] font-extrabold tracking-[0.22em] text-gold-ink">{t.story.eyebrow}</p>
          <h2 className="font-display mt-5 text-[clamp(34px,3.6vw,46px)] font-normal leading-[1.1]">
            {t.story.titleA} <em className="italic text-gold-ink">{t.story.titleB}</em>
          </h2>
          <p className="mt-6 text-[17px] leading-[1.75] text-ink/80">
            {t.story.body}
          </p>
          <Link href="/about" className="mt-6 inline-block font-semibold text-gold-ink underline underline-offset-4">{t.story.more}</Link>
        </div>
        <div className="grid content-start gap-5 min-[600px]:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-[22px] bg-[#fffaf0] p-8">
            <span className="text-xs font-extrabold tracking-[0.2em] text-gold-ink">{t.story.mission}</span>
            <p className="font-display text-[21px] leading-[1.45]">
              {t.story.missionText}
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-[22px] bg-forest-900 p-8 text-cream">
            <span className="text-xs font-extrabold tracking-[0.2em] text-gold">{t.story.vision}</span>
            <p className="font-display text-[21px] leading-[1.45]">
              {t.story.visionText}
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
