import { JsonLd } from '@/components/JsonLd';
import { GiveBand } from '@/components/home/GiveBand';
import { Hero } from '@/components/home/Hero';
import { MessageAndEvents } from '@/components/home/MessageAndEvents';
import { OneBand } from '@/components/home/OneBand';
import { PastorWelcome } from '@/components/home/PastorWelcome';
import { PhotoStrip, type StripPhoto } from '@/components/home/PhotoStrip';
import { PlanVisit } from '@/components/home/PlanVisit';
import { Scripture } from '@/components/home/Scripture';
import { Story } from '@/components/home/Story';
import { WeeklyRhythm, pickRhythm } from '@/components/home/WeeklyRhythm';
import { cmsMetadata, loadCmsPage } from '@/components/CmsArticle';
import { getLive, listAnnouncements, listEvents, listLeaders, listPublicAlbums, listServiceTimes, listSermons } from '@/lib/api';
import { plccOneUrl, siteEnv } from '@/lib/env';
import { parseHome } from '@/lib/home';
import { churchJsonLd } from '@/lib/jsonld';
import { scheduleFromHome, scheduleFromServiceTimes } from '@/lib/schedule';

export async function generateMetadata() {
  return cmsMetadata('home', 'A Pentecostal church in Kampala.');
}

export default async function HomePage() {
  const [page, announcements, events, sermons, live, gallery, serviceTimes, leaders] = await Promise.all([
    loadCmsPage('home'),
    listAnnouncements(),
    listEvents(),
    listSermons(),
    getLive(),
    listPublicAlbums(),
    listServiceTimes(),
    listLeaders(),
  ]);
  const home = parseHome(page);
  const schedule = serviceTimes.length ? scheduleFromServiceTimes(serviceTimes) : scheduleFromHome(home.times);
  const week = schedule.filter((item) => item.featured);
  const nextService = week.find((item) => item.day === 'SUN') ?? week[0] ?? null;
  const oneUrl = plccOneUrl();
  const latest = sermons[0] ?? null;
  const pastor = leaders.find((leader) => leader.photoUrl);

  // Real photos only, in order: the home page photo set in the dashboard, then recent gallery moments.
  const photos: StripPhoto[] = [
    ...(page.heroImageUrl ? [{ key: 'home-hero', url: page.heroImageUrl, alt: 'Promised Land Christian Center', href: '/gallery' }] : []),
    ...gallery.moments.map((photo) => ({
      key: photo.id,
      url: photo.url,
      alt: photo.alt,
      href: photo.album?.slug ? `/gallery/${photo.album.slug}` : '/gallery',
    })),
  ];

  return (
    <>
      <JsonLd data={churchJsonLd(siteEnv().siteUrl, serviceTimes)} />
      <Hero lead={home.lead} next={nextService} live={live} oneUrl={oneUrl} image={home.hero} />
      <WeeklyRhythm items={pickRhythm(schedule)} />
      {announcements[0] ? (
        <p className="bg-sand px-4 py-4 text-center text-ink sm:px-6">
          <strong className="mr-2 font-semibold text-gold-ink">Announcement</strong>
          {announcements[0].title}
        </p>
      ) : null}
      <PastorWelcome text={home.welcome} photo={pastor?.photoUrl} photoAlt={pastor?.name} />
      {home.scripture ? <Scripture scripture={home.scripture} /> : null}
      <Story />
      <OneBand oneUrl={oneUrl} />
      <PhotoStrip photos={photos} />
      <MessageAndEvents sermon={latest} events={events.slice(0, 3)} />
      <PlanVisit points={home.visit} image={home.hero} />
      <GiveBand />
    </>
  );
}
