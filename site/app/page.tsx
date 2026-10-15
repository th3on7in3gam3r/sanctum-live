import { JsonLd } from '@/components/JsonLd';
import { ComingUp } from '@/components/home/ComingUp';
import Image from 'next/image';
import Link from 'next/link';
import { Gather } from '@/components/home/Gather';
import { Hero } from '@/components/home/Hero';
import { LatestMessage } from '@/components/home/LatestMessage';
import { PastorWelcome } from '@/components/home/PastorWelcome';
import { WordMarquee } from '@/components/home/WordMarquee';
import { PlanVisit } from '@/components/home/PlanVisit';
import { SanctumBand } from '@/components/home/SanctumBand';
import { Scripture } from '@/components/home/Scripture';
import { cmsMetadata, loadCmsPage } from '@/components/CmsArticle';
import { getLive, listAnnouncements, listEvents, listPublicAlbums, listServiceTimes, listSermons } from '@/lib/api';
import { prayerJoinUrl, siteEnv } from '@/lib/env';
import { parseHome } from '@/lib/home';
import { churchJsonLd } from '@/lib/jsonld';
import { cardsFromHome, homeStrip, toCard } from '@/lib/schedule';

export async function generateMetadata() {
  return cmsMetadata('home', 'A Pentecostal church in Kampala.');
}

export default async function HomePage() {
  const [page, announcements, events, sermons, live, gallery, serviceTimes] = await Promise.all([
    loadCmsPage('home'),
    listAnnouncements(),
    listEvents(),
    listSermons(),
    getLive(),
    listPublicAlbums(),
    listServiceTimes(),
  ]);
  const home = parseHome(page);
  const strip = serviceTimes.length ? homeStrip(serviceTimes) : cardsFromHome(home.times, ['Sunday', 'Wednesday Upper Room', 'Friday Intercessors']).map((item) => item.name);
  const featured = serviceTimes.length
    ? serviceTimes.filter((time) => time.showOnHome).map(toCard)
    : cardsFromHome(home.times, strip);
  const prayerUrl = prayerJoinUrl();
  const liveRoom = live?.rooms?.find((room) => room.status === 'LIVE');
  const bandUrl = liveRoom ? `${siteEnv().sanctumAppUrl}/join/${liveRoom.slug}` : prayerUrl;
  const latest = sermons[0];

  return (
    <>
      <JsonLd data={churchJsonLd(siteEnv().siteUrl, serviceTimes)} />
      <Hero lead={home.lead} times={featured} strip={strip} hero={home.hero} prayerUrl={prayerUrl} />
      <WordMarquee />
      {announcements[0] ? (
        <p className="bg-sand px-4 py-4 text-center text-ink sm:px-6">{announcements[0].title}</p>
      ) : null}
      <PastorWelcome text={home.welcome} photo={page.heroImageUrl} />
      {home.scripture ? <Scripture scripture={home.scripture} /> : null}
      {featured.length ? <Gather times={featured} /> : null}
      <SanctumBand live={live} prayerUrl={bandUrl} />
      {latest ? <LatestMessage sermon={latest} /> : null}
      <ComingUp events={events.slice(0, 4)} />
      {gallery.moments.length ? (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="font-display text-3xl">Recent moments</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {gallery.moments.map((photo) => (
              <Link key={photo.id} href={photo.album?.slug ? `/gallery/${photo.album.slug}` : '/gallery'} className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl">
                <Image src={photo.url} alt={photo.alt} fill sizes="144px" className="object-cover" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <PlanVisit points={home.visit} photo={page.heroImageUrl} />
    </>
  );
}
