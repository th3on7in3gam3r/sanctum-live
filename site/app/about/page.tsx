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
import { getDictionary } from '@/lib/locale';
import { label } from '@/lib/i18n';

export async function generateMetadata() {
  return cmsMetadata('about', 'About Promised Land Christian Center.');
}

export default async function AboutPage() {
  const [about, beliefs, leaders, { locale, t }] = await Promise.all([
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

  return (
    <>
      <PageHero
        variant="split"
        eyebrow={a.eyebrow}
        title={a.titleA}
        accent={a.titleB}
        lede={translated ? t.story.missionText : firstParagraph(about)}
        photo={about.heroImageUrl || '/warm-welcome.jpg'}
      />

      <section className="bg-cream px-4 py-20 text-ink sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <p className="eyebrow">{a.whoWeAre}</p>
            <h2 className="font-display mt-3 text-[clamp(40px,5vw,56px)] font-light leading-none tracking-[-0.02em]">
              {a.missionVision}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/70">
              {a.missionLede}
            </p>
          </div>

          <div className="mt-12 grid border-t border-ink/15 min-[900px]:grid-cols-2">
            {mission ? (
              <article className="border-b border-ink/15 py-8 min-[900px]:border-r min-[900px]:pr-10">
                <p className="font-display text-lg tabular-nums tracking-wide text-gold">01</p>
                <h3 className="font-display mt-4 text-3xl font-light tracking-[-0.02em]">{a.mission}</h3>
                <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink/80">{translated ? t.story.missionText : mission.text}</p>
              </article>
            ) : null}
            {vision ? (
              <article className="border-b border-ink/15 py-8 min-[900px]:pl-10">
                <p className="font-display text-lg tabular-nums tracking-wide text-gold">02</p>
                <h3 className="font-display mt-4 text-3xl font-light tracking-[-0.02em]">{a.vision}</h3>
                <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink/80">{translated ? t.story.visionText : vision.text}</p>
              </article>
            ) : null}
          </div>

          {origin ? (
            <article className="mt-16 grid gap-8 border-t border-ink/15 pt-12 min-[900px]:grid-cols-[0.9fr_1.4fr] min-[900px]:gap-14">
              <div>
                <p className="font-display text-lg tabular-nums tracking-wide text-gold">03</p>
                <h3 className="font-display mt-4 text-[clamp(36px,4vw,48px)] font-light leading-none tracking-[-0.02em]">
                  {a.ourStory}
                </h3>
                <p className="mt-4 text-ink/60">{a.storyLede}</p>
              </div>
              <p className="text-[17px] leading-[1.75] text-ink/85">{translated ? t.story.body : origin.text}</p>
            </article>
          ) : null}
        </div>
      </section>

      <section className="bg-sand px-4 py-20 text-ink sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeader eyebrow={label(t, 'Leadership')} title={a.shepherdsA} accent={a.shepherdsB} />
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
          <SectionHeader title={a.rooted} href="/beliefs" linkLabel={a.fullStatement} dark />
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
        title={a.comeSee}
        primary={{ href: '/visit', label: t.hero.planVisit }}
        secondary={{ href: prayerJoinUrl(), label: a.joinLive }}
      />
    </>
  );
}
