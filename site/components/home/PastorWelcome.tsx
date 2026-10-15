import { church } from '@/lib/church';
import { GlowPhoto } from '@/components/GlowPhoto';
import { Reveal } from '@/components/home/Reveal';

export function PastorWelcome({ text, photo }: { text: string; photo?: string | null }) {
  return (
    <section className="bg-cream px-4 py-20 text-ink sm:px-6">
      <Reveal className="mx-auto grid max-w-6xl items-center gap-12 min-[900px]:grid-cols-2">
        <div className="relative pb-8 pl-0 min-[900px]:pb-0">
          <div className="absolute left-7 top-7 hidden h-full w-full border border-gold min-[900px]:block" aria-hidden="true" />
          <GlowPhoto src={photo} alt="" sizes="(min-width: 900px) 40vw, 100vw" className="relative min-h-[420px] border border-gold" />
        </div>
        <div>
          <p className="eyebrow">A word from our pastor</p>
          <h2 className="font-display mt-4 text-5xl font-light leading-tight tracking-tight">
            You were never meant to walk <em className="italic text-gold-ink">alone.</em>
          </h2>
          {text ? <p className="mt-6 text-lg leading-relaxed">{text}</p> : null}
          <p className="font-display mt-8 text-xl text-gold-ink">{church.pastor}</p>
        </div>
      </Reveal>
    </section>
  );
}
