import Link from 'next/link';

export function GiveBand() {
  return (
    <section className="bg-gold px-4 py-16 text-ink sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
        <div className="min-w-0 max-w-2xl">
          <h2 className="font-display text-[clamp(30px,3.4vw,40px)] font-normal leading-[1.1]">Partner with what God is doing at PLCC.</h2>
          <p className="mt-2.5 text-[17px] text-ink/80">Give your tithe and offerings, in person or online.</p>
        </div>
        <Link href="/give" className="site-button min-h-[54px] bg-forest-950 px-8 text-[16px] font-extrabold text-cream">Give now</Link>
      </div>
    </section>
  );
}
