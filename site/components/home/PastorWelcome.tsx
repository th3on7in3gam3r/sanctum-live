import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/home/Reveal';

/**
 * The portrait only renders when a real photo exists (a leader's photo from the dashboard).
 * Without one the section is text-only instead of an empty frame.
 */
export function PastorWelcome({ text, photo, photoAlt }: { text: string; photo?: string | null; photoAlt?: string }) {
  return (
    <section className="bg-cream px-4 py-24 text-ink sm:px-6">
      <Reveal className={`mx-auto grid max-w-6xl items-center gap-12 ${photo ? 'min-[900px]:grid-cols-[420px_1fr] min-[900px]:gap-16' : ''}`}>
        {photo ? (
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-[28px]">
            <Image src={photo} alt={photoAlt || ''} fill sizes="(min-width: 900px) 420px, 90vw" className="object-cover" />
          </div>
        ) : null}
        <div className={photo ? '' : 'mx-auto max-w-3xl text-center'}>
          <p className="text-[13px] font-extrabold tracking-[0.22em] text-gold-ink">A WORD FROM OUR PASTORS</p>
          <h2 className="font-display mt-5 text-[clamp(36px,4vw,56px)] font-normal leading-[1.08] tracking-[-0.02em]">
            Come as you are. There is a place for you <em className="italic text-gold-ink">here.</em>
          </h2>
          <p className={`mt-6 text-lg leading-relaxed text-ink/80 ${photo ? 'max-w-xl' : 'mx-auto max-w-2xl'}`}>
            {text || 'We know visiting a new church can feel like a big step. Wherever you are in your walk with Christ, you are welcome in this family.'}
          </p>
          <p className="font-display mt-6 text-[22px] italic">Pastor Grace &amp; Pastor Kennedy Hiire</p>
          <p className="mt-1 text-sm font-bold tracking-[0.12em] text-ink/60">SENIOR PASTORS</p>
          <Link href="/leadership" className="mt-6 inline-block font-semibold text-gold-ink underline underline-offset-4">Meet our leaders</Link>
        </div>
      </Reveal>
    </section>
  );
}
