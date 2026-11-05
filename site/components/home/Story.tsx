import Link from 'next/link';
import { Reveal } from '@/components/home/Reveal';

export function Story() {
  return (
    <section className="bg-[#efe7d6] px-4 py-24 text-ink sm:px-6">
      <Reveal className="mx-auto grid max-w-6xl gap-14 min-[900px]:grid-cols-2">
        <div>
          <p className="text-[13px] font-extrabold tracking-[0.22em] text-gold-ink">OUR STORY</p>
          <h2 className="font-display mt-5 text-[clamp(34px,3.6vw,46px)] font-normal leading-[1.1]">
            It began on a small mat, beside a bed, in <em className="italic text-gold-ink">prayer.</em>
          </h2>
          <p className="mt-6 text-[17px] leading-[1.75] text-ink/80">
            For close to a year, one woman prayed night and day until the instruction came. A prayer altar of about
            twelve people grew in the living room of Mr. and Mrs. Hiire&rsquo;s home, until the house was no longer
            enough. Then there came PLCC.
          </p>
          <Link href="/about" className="mt-6 inline-block font-semibold text-gold-ink underline underline-offset-4">Read our full story</Link>
        </div>
        <div className="grid content-start gap-5 min-[600px]:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-[22px] bg-[#fffaf0] p-8">
            <span className="text-xs font-extrabold tracking-[0.2em] text-gold-ink">MISSION</span>
            <p className="font-display text-[21px] leading-[1.45]">
              To reach the lost, restore the broken, and raise disciples to live boldly for Christ in every area of life.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-[22px] bg-forest-900 p-8 text-cream">
            <span className="text-xs font-extrabold tracking-[0.2em] text-gold">VISION</span>
            <p className="font-display text-[21px] leading-[1.45]">
              A Spirit-led church where people encounter God, are transformed, and live on mission every day.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
