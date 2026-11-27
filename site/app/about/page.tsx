import Link from 'next/link';
import { GlowPhoto } from '@/components/GlowPhoto';
import { cmsMetadata, loadCmsPage } from '@/components/CmsArticle';
import {
  ArrowIcon,
  BookIcon,
  BroadcastIcon,
  CalendarIcon,
  EyeIcon,
  SeedlingArt,
  TargetIcon,
  beliefIcon,
} from '@/components/page/AboutArt';
import { getPage, listLeaders, type PublicLeader } from '@/lib/api';
import { prayerJoinUrl } from '@/lib/env';
import { isPastor, leaderBio, leaderPhotoUrl, leaderSocials, withBuiltInLeaders, type LeaderSocial } from '@/lib/leaders';
import { firstParagraph, headingPairs } from '@/lib/pages';
import { getDictionary } from '@/lib/locale';
import { label } from '@/lib/i18n';

export async function generateMetadata() {
  return cmsMetadata('about', 'About Promised Land Christian Center.');
}

/** Centered "— WHO WE ARE —" eyebrow with gold rules either side. */
function RuledEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow flex items-center justify-center gap-4">
      <span aria-hidden="true" className="h-px w-10 bg-gold/70 sm:w-20" />
      {children}
      <span aria-hidden="true" className="h-px w-10 bg-gold/70 sm:w-20" />
    </p>
  );
}

const socialPaths: Record<LeaderSocial['kind'], React.ReactNode> = {
  youtube: <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />,
  tiktok: <path d="M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2-2.8V9.1a6.3 6.3 0 1 0 5.4 6.3V8.6a8 8 0 0 0 4.4 1.4V6.6a4.6 4.6 0 0 1-4.4-4.6z" />,
  whatsapp: <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.3-.2-.6-.3z" />,
};

function LeaderSocials({ leader }: { leader: PublicLeader }) {
  const links = leaderSocials(leader);
  if (!links.length) return null;
  return (
    <ul className="mt-5 flex gap-2.5">
      {links.map((link) => (
        <li key={link.kind}>
          <a
            href={link.href}
            aria-label={link.label}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/70 text-gold-light transition hover:bg-gold hover:text-forest-900"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden="true">
              {socialPaths[link.kind]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

function LeaderCard({ leader, compact = false }: { leader: PublicLeader; compact?: boolean }) {
  const bio = leaderBio(leader);
  return (
    <article className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <GlowPhoto
        src={leaderPhotoUrl(leader)}
        alt={leader.name}
        sizes={compact ? '180px' : '(min-width: 640px) 220px, 80vw'}
        className={`aspect-[6/7] shrink-0 rounded-[26px] border-2 border-gold/80 shadow-[0_0_40px_rgba(201,163,90,0.25)] ${compact ? 'w-40 sm:w-44' : 'w-56 sm:w-52 lg:w-56'}`}
      />
      <div className="min-w-0">
        <span className="inline-block rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-forest-900">
          {leader.role}
        </span>
        <h3 className={`font-display mt-3 font-light leading-tight tracking-[-0.02em] ${compact ? 'text-[28px]' : 'text-[clamp(26px,2.5vw,34px)]'}`}>
          {leader.name}
        </h3>
        {bio ? <p className="mt-3 max-w-sm text-[16px] leading-relaxed text-sand/85">{bio}</p> : null}
        <LeaderSocials leader={leader} />
      </div>
    </article>
  );
}

export default async function AboutPage() {
  const [about, beliefs, cmsLeaders, { locale, t }] = await Promise.all([
    loadCmsPage('about'),
    getPage('beliefs'),
    listLeaders(),
    getDictionary(),
  ]);
  const a = t.pages.about;
  // Text written in Canaan is English; other languages use the translated versions we have.
  const translated = locale !== 'en';
  const story = headingPairs(about, ['Mission', 'Vision', 'Story']);
  const mission = story.find((item) => item.title === 'Mission');
  const vision = story.find((item) => item.title === 'Vision');
  const origin = story.find((item) => item.title === 'Story');
  const beliefCells = headingPairs(beliefs).slice(0, 4);

  const leaders = withBuiltInLeaders(cmsLeaders);
  const pastors = leaders.filter(isPastor);
  const team = leaders.filter((leader) => !isPastor(leader));

  const missionText = translated ? t.story.missionText : mission?.text || t.story.missionText;
  const visionText = translated ? t.story.visionText : vision?.text || t.story.visionText;
  const storyText = translated ? t.story.body : origin?.text || t.story.body;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest-900 text-on-dark">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(circle at 12% 0%, rgba(201,163,90,0.18), transparent 40%), linear-gradient(180deg, #1d372c 0%, #12231c 60%, #0d1a14 100%)' }}
        />
        {/* Photo bleeds off the right edge; a soft curve and gold sweep separate it from the words. */}
        <div
          className="about-hero-photo relative h-72 min-[900px]:absolute min-[900px]:inset-y-0 min-[900px]:right-0 min-[900px]:h-full min-[900px]:w-[56%]"
        >
          <GlowPhoto src={about.heroImageUrl || '/warm-welcome.jpg'} alt="" priority sizes="(min-width: 900px) 56vw, 100vw" className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-900/70 to-transparent min-[900px]:bg-gradient-to-r min-[900px]:from-forest-900/50 min-[900px]:via-transparent" />
        </div>
        <svg
          viewBox="0 0 1200 520"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 hidden h-full w-full min-[900px]:block"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="about-sweep" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#e4c98f" stopOpacity="0" />
              <stop offset="0.35" stopColor="#e4c98f" stopOpacity="0.9" />
              <stop offset="1" stopColor="#c9a35a" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d="M-20 470C220 520 470 470 560 300S640 40 760 -20" stroke="url(#about-sweep)" strokeWidth="4" fill="none" />
          <path d="M-20 490C240 540 500 490 590 315S670 55 790 -10" stroke="url(#about-sweep)" strokeWidth="1.5" fill="none" opacity=".5" />
        </svg>

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 min-[900px]:py-24">
          <div className="max-w-xl min-[900px]:max-w-[47%]">
            <p className="eyebrow flex items-center gap-3">
              {a.eyebrow}
              <span aria-hidden="true" className="h-px w-12 bg-gold/70" />
            </p>
            <h1 className="font-display mt-4 text-[clamp(44px,5.2vw,72px)] font-light leading-[0.98] tracking-[-0.03em]">
              {a.titleA}
              <br />
              <em className="italic text-gold-light">{a.titleB}</em>
            </h1>
            <p className="mt-6 max-w-md text-[18px] leading-relaxed text-[#CFC6B2]">
              {translated ? t.story.missionText : firstParagraph(about)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/visit" className="site-button bg-gold px-6 text-forest-900 transition hover:bg-gold-light">
                {a.visitCta} <ArrowIcon className="h-4 w-4" />
              </Link>
              <Link href="/ministries" className="site-button border border-on-dark/80 px-6 text-on-dark transition hover:bg-white/10">
                {label(t, 'Join a Ministry')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission & Vision + Our story ─────────────────────── */}
      <section className="bg-cream px-4 py-20 text-ink sm:px-6" style={{ background: 'linear-gradient(180deg, #f5f1e8 0%, #f5eedd 100%)' }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <RuledEyebrow>{a.whoWeAre}</RuledEyebrow>
            <h2 className="font-display mt-3 text-[clamp(38px,4.6vw,54px)] font-light leading-none tracking-[-0.02em]">
              {a.missionVision}
            </h2>
          </div>

          <div className="mt-12 grid gap-5 min-[900px]:grid-cols-2">
            {[
              { title: a.mission, text: missionText, Icon: TargetIcon },
              { title: a.vision, text: visionText, Icon: EyeIcon },
            ].map(({ title, text, Icon }) => (
              <article key={title} className="flex gap-5 rounded-[22px] border border-ink/[0.06] bg-white/80 p-7 shadow-[0_18px_40px_rgba(22,37,31,0.07)]">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-forest-900 text-gold-light shadow-[0_8px_20px_rgba(13,26,20,0.25)]">
                  <Icon className="h-7 w-7" />
                </span>
                <div>
                  <h3 className="font-display text-[26px] font-light tracking-[-0.01em]">{title}</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-ink/75">{text}</p>
                </div>
              </article>
            ))}
          </div>

          <article className="mt-14 grid items-center gap-8 min-[900px]:grid-cols-[minmax(0,300px)_1fr] min-[900px]:gap-12">
            <div className="overflow-hidden rounded-[22px] shadow-[0_18px_40px_rgba(22,37,31,0.15)]">
              <SeedlingArt className="block h-auto w-full" />
            </div>
            <div className="border-gold/70 min-[900px]:border-l min-[900px]:pl-10">
              <h3 className="font-display text-[clamp(34px,3.6vw,44px)] font-light leading-none tracking-[-0.02em]">{a.ourStory}</h3>
              <p className="font-display mt-3 text-xl italic text-gold-ink">{a.storyLede}</p>
              <p className="mt-4 text-[17px] leading-[1.75] text-ink/80">{storyText}</p>
            </div>
          </article>
        </div>
      </section>

      {/* ── Leadership ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest-900 px-4 py-20 text-on-dark sm:px-6">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(circle at 100% 100%, rgba(201,163,90,0.22), transparent 35%), radial-gradient(circle at 0% 0%, rgba(201,163,90,0.12), transparent 30%)' }}
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <RuledEyebrow>{label(t, 'Leadership')}</RuledEyebrow>
            <h2 className="font-display mt-3 text-[clamp(38px,4.6vw,54px)] font-light leading-tight tracking-[-0.02em]">
              {a.shepherdsA} <em className="italic text-gold-light">{a.shepherdsB}</em>
            </h2>
          </div>

          {pastors.length ? (
            <ul className="mt-14 grid gap-12 min-[900px]:grid-cols-2 min-[900px]:gap-0">
              {pastors.map((leader, index) => (
                <li
                  key={leader.id}
                  className={index % 2 === 1 ? 'min-[900px]:border-l min-[900px]:border-white/15 min-[900px]:pl-12' : 'min-[900px]:pr-12'}
                >
                  <LeaderCard leader={leader} />
                </li>
              ))}
            </ul>
          ) : null}

          {team.length ? (
            <div className="mt-16 border-t border-white/15 pt-12">
              <p className="eyebrow text-center">{a.servingAlongside}</p>
              <ul className={`mt-10 grid gap-10 ${team.length > 1 ? 'min-[900px]:grid-cols-2' : 'mx-auto max-w-xl'}`}>
                {team.map((leader) => (
                  <li key={leader.id}>
                    <LeaderCard leader={leader} compact />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Rooted in the Word ───────────────────────────────── */}
      {beliefCells.length ? (
        <section className="bg-cream-50 px-4 py-16 text-ink sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-10 min-[1000px]:grid-cols-[260px_1fr] min-[1000px]:items-center">
            <div>
              <BookIcon className="h-14 w-14 text-gold-ink" />
              <h2 className="font-display mt-4 text-[clamp(32px,3.4vw,42px)] font-light leading-tight tracking-[-0.02em]">{a.rooted}</h2>
              <Link href="/beliefs" className="mt-3 inline-block font-semibold text-gold-ink hover:underline">
                {a.fullStatement}
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-y-10 min-[760px]:grid-cols-4">
              {beliefCells.map((cell, index) => {
                const Icon = beliefIcon(cell.title, index);
                return (
                  <li
                    key={cell.title}
                    className={`px-4 text-center ${index > 0 ? 'min-[760px]:border-l min-[760px]:border-ink/10' : ''} ${index % 2 === 1 ? 'border-l border-ink/10 min-[760px]:border-l' : ''}`}
                  >
                    <Icon className="mx-auto h-10 w-10 text-forest-900" />
                    <p className="mt-3 text-[17px] font-semibold">{cell.title}</p>
                    <p className="mt-2 line-clamp-4 text-[14px] leading-relaxed text-ink/70">{cell.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── Come and see ─────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-14 text-on-dark sm:px-6" style={{ background: 'linear-gradient(180deg, #d9a54a 0%, #9c7a35 38%, #2c4a33 70%, #12231c 100%)' }}>
        <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 w-full" aria-hidden="true">
          <path d="M0 120c120-40 240-60 380-30s250 40 400 0 300-50 420-20v130H0z" fill="#2a4630" opacity=".7" />
          <path d="M0 150c160-30 300-20 450 5s300 20 450-10 220-20 300-5v60H0z" fill="#17301f" />
        </svg>
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
          <h2 className="font-display text-[clamp(34px,4vw,48px)] font-light leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">{a.comeSee}</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/visit" className="site-button bg-gold px-6 text-forest-900 shadow-lg transition hover:bg-gold-light">
              <CalendarIcon className="h-5 w-5" /> {t.hero.planVisit}
            </Link>
            <a href={prayerJoinUrl()} className="site-button border border-on-dark/80 bg-forest-900/30 px-6 text-on-dark backdrop-blur transition hover:bg-white/10">
              <BroadcastIcon className="h-5 w-5" /> {a.joinLive}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
