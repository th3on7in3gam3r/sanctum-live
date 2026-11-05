import { CtaBand } from '@/components/page/CtaBand';
import { PageHero } from '@/components/page/PageHero';
import { PhotoTile } from '@/components/page/PhotoTile';
import { SectionHeader } from '@/components/page/SectionHeader';
import { cmsMetadata, loadCmsPage } from '@/components/CmsArticle';
import { getPage, listLeaders } from '@/lib/api';
import { church } from '@/lib/church';
import { prayerJoinUrl } from '@/lib/env';
import { leaderBio, leaderPhotoUrl } from '@/lib/leaders';
import { firstParagraph, headingPairs } from '@/lib/pages';

export async function generateMetadata() {
  return cmsMetadata('about', 'About Promised Land Christian Center.');
}

export default async function AboutPage() {
  const [about, beliefs, leaders] = await Promise.all([
    loadCmsPage('about'),
    getPage('beliefs'),
    listLeaders(),
  ]);
  const story = headingPairs(about, ['Mission', 'Vision', 'Story']);
  const mission = story.find((item) => item.title === 'Mission');
  const vision = story.find((item) => item.title === 'Vision');
  const origin = story.find((item) => item.title === 'Story');
  const beliefCells = headingPairs(beliefs).slice(0, 4);

  return (
    <>
      <PageHero
        variant="split"
        eyebrow="About us"
        title="Changing hearts."
        accent="Transforming lives."
        lede={firstParagraph(about)}
        photo={about.heroImageUrl || '/warm-welcome.jpg'}
      />

      <section className="bg-cream px-4 py-20 text-ink sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <p className="eyebrow">Who we are</p>
            <h2 className="font-display mt-3 text-[clamp(40px,5vw,56px)] font-light leading-none tracking-[-0.02em]">
              Mission &amp; vision
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/70">
              Why we gather, and where we believe God is leading this house.
            </p>
          </div>

          <div className="mt-12 grid border-t border-ink/15 min-[900px]:grid-cols-2">
            {mission ? (
              <article className="border-b border-ink/15 py-8 min-[900px]:border-r min-[900px]:pr-10">
                <p className="font-display text-lg tabular-nums tracking-wide text-gold">01</p>
                <h3 className="font-display mt-4 text-3xl font-light tracking-[-0.02em]">{mission.title}</h3>
                <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink/80">{mission.text}</p>
              </article>
            ) : null}
            {vision ? (
              <article className="border-b border-ink/15 py-8 min-[900px]:pl-10">
                <p className="font-display text-lg tabular-nums tracking-wide text-gold">02</p>
                <h3 className="font-display mt-4 text-3xl font-light tracking-[-0.02em]">{vision.title}</h3>
                <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink/80">{vision.text}</p>
              </article>
            ) : null}
          </div>

          {origin ? (
            <article className="mt-16 grid gap-8 border-t border-ink/15 pt-12 min-[900px]:grid-cols-[0.9fr_1.4fr] min-[900px]:gap-14">
              <div>
                <p className="font-display text-lg tabular-nums tracking-wide text-gold">03</p>
                <h3 className="font-display mt-4 text-[clamp(36px,4vw,48px)] font-light leading-none tracking-[-0.02em]">
                  Our story
                </h3>
                <p className="mt-4 text-ink/60">From a bedroom prayer altar to a growing church family.</p>
              </div>
              <p className="text-[17px] leading-[1.75] text-ink/85">{origin.text}</p>
            </article>
          ) : null}
        </div>
      </section>

      <section className="bg-sand px-4 py-20 text-ink sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeader eyebrow="Leadership" title="Shepherds who" accent="walk with you." />
          {leaders.length ? (
            <ul className="mt-12 grid gap-10 min-[900px]:grid-cols-2 min-[900px]:gap-12">
              {leaders.map((leader, index) => {
                const bio = leaderBio(leader);
                return (
                  <li key={leader.id} className={index > 0 ? 'min-[900px]:border-l min-[900px]:border-ink/10 min-[900px]:pl-12' : ''}>
                    <PhotoTile
                      src={leaderPhotoUrl(leader)}
                      alt={leader.name}
                      sizes="(min-width: 900px) 40vw, 100vw"
                      className="aspect-[4/5] rounded-[22px]"
                    />
                    <p className="eyebrow mt-6">{leader.role}</p>
                    <h3 className="font-display mt-2 text-[clamp(32px,3.5vw,44px)] font-light leading-none tracking-[-0.02em]">
                      {leader.name}
                    </h3>
                    {bio ? <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink/80">{bio}</p> : null}
                    {index === 0 ? (
                      <div className="mt-6 flex flex-wrap gap-3">
                        <a href={church.youtube} className="site-button bg-forest-900 text-on-dark">{church.youtubeLabel}</a>
                        <a href={church.tiktok} className="site-button border border-ink text-ink">{church.tiktokLabel}</a>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="bg-forest-900 px-4 py-20 text-on-dark sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeader title="Rooted in the Word." href="/beliefs" linkLabel="Full statement of faith →" dark />
          <ul className="mt-12 grid border-t border-white/15 min-[900px]:grid-cols-2">
            {beliefCells.map((cell, index) => (
              <li
                key={cell.title}
                className={`border-b border-white/15 py-7 min-[900px]:px-8 ${index % 2 === 0 ? 'min-[900px]:border-r min-[900px]:pl-0' : ''}`}
              >
                <p className="font-display text-lg tabular-nums tracking-wide text-gold">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <p className="font-display mt-3 text-2xl font-light tracking-[-0.02em]">{cell.title}</p>
                <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-sand">{cell.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        title="Come and see for yourself."
        primary={{ href: '/visit', label: 'Plan your visit' }}
        secondary={{ href: prayerJoinUrl(), label: 'Join live prayer' }}
      />
    </>
  );
}
