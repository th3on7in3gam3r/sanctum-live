import type { ServiceTime } from '@/lib/home';
import { Reveal } from '@/components/home/Reveal';

export function Gather({ times }: { times: ServiceTime[] }) {
  return (
    <section className="bg-forest-900 px-4 py-20 text-on-dark sm:px-6">
      <Reveal className="mx-auto max-w-6xl">
        <h2 className="font-display text-5xl font-light">Find your place in the week.</h2>
        <ul className="mt-10 grid gap-4 min-[900px]:grid-cols-3">
          {times.map((item) => (
            <li key={item.day} className="glow-tile relative min-h-[460px] overflow-hidden rounded-[22px]">
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="eyebrow">{item.day}</p>
                <p className="mt-3 text-sm text-gold-light">{item.time}</p>
                <p className="font-display mt-1 text-3xl">{item.name}</p>
                <p className="mt-2 text-sand">{item.line}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
