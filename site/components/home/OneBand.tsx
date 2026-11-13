import { fill, label, type Dict } from '@/lib/i18n';
import type React from 'react';
import { Reveal } from '@/components/home/Reveal';

const TILES: { title: string; body: keyof Pick<Dict['one'], 'prayerBody' | 'chatBody' | 'connectBody' | 'titheBody'>; icon: React.ReactNode; prayer?: boolean }[] = [
  {
    title: 'Live prayer',
    prayer: true,
    body: 'prayerBody',
    icon: (
      <>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <path d="M12 19v3" />
      </>
    ),
  },
  {
    title: 'PLCC Chat',
    body: 'chatBody',
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    title: 'PLCC Connect',
    body: 'connectBody',
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    title: 'PLCC Tithe',
    body: 'titheBody',
    icon: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />,
  },
];

/** Invites members into PLCC ONE (live prayer, chat, connect, giving under one sign-in). */
export function OneBand({ oneUrl, prayerUrl, t }: { oneUrl: string; prayerUrl: string; t: Dict }) {
  return (
    <section id="plcc-one" className="bg-forest-950 px-4 py-24 text-cream sm:px-6">
      <Reveal className="mx-auto flex max-w-6xl flex-col gap-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[13px] font-extrabold tracking-[0.22em] text-gold">{t.one.eyebrow}</p>
            <h2 className="font-display mt-5 text-[clamp(38px,4.4vw,62px)] font-light leading-[1.05] tracking-[-0.02em]">
              {t.one.titleA} <em className="italic text-gold-light">{t.one.titleB}</em>
            </h2>
            <p className="mt-5 max-w-[560px] text-lg leading-relaxed text-muted-dark">
              {t.one.body}
            </p>
          </div>
          <a href={oneUrl} className="site-button min-h-[54px] bg-gold px-8 text-[16px] font-extrabold text-ink">
            {t.hero.stepIn}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
        <ul className="grid gap-5 min-[600px]:grid-cols-2 min-[1000px]:grid-cols-4">
          {TILES.map((tile) => (
            <li key={tile.title}>
              <a
                href={tile.prayer ? prayerUrl : oneUrl}
                className="flex h-full flex-col gap-3.5 rounded-[22px] border border-gold/30 bg-forest-900 p-7 transition hover:-translate-y-0.5 hover:border-gold/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-gold-light" aria-hidden="true">
                {tile.icon}
              </svg>
              <span className="font-display text-[24px]">{tile.prayer ? label(t, 'Live prayer') : tile.title}</span>
              <span className="text-[15px] leading-relaxed text-muted-dark">{t.one[tile.body]}</span>
              <span className="mt-auto pt-2 text-[14px] font-extrabold text-gold-light">
                {tile.prayer ? t.one.joinLive : fill(t.one.open, { app: tile.title })}
              </span>
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
