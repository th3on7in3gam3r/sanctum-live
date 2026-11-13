import { PageHero } from '@/components/page/PageHero';
import { PhotoTile } from '@/components/page/PhotoTile';
import { cmsMetadata, loadCmsPage } from '@/components/CmsArticle';
import { listLeaders } from '@/lib/api';
import { leaderBio, leaderPhotoUrl } from '@/lib/leaders';
import { firstParagraph } from '@/lib/pages';
import { getDictionary } from '@/lib/locale';
import { label } from '@/lib/i18n';

export async function generateMetadata() {
  return cmsMetadata('leadership', 'Leadership at Promised Land Christian Center.');
}

export default async function LeadershipPage() {
  const [page, leaders, { t }] = await Promise.all([loadCmsPage('leadership'), listLeaders(), getDictionary()]);
  return (
    <>
      <PageHero variant="centered" eyebrow={label(t, 'Leadership')} title={page.title} lede={firstParagraph(page)} />
      <section className="bg-sand px-4 py-16 sm:px-6">
        <ul className="mx-auto grid max-w-6xl gap-8 min-[900px]:grid-cols-3">
          {leaders.map((leader) => {
            const bio = leaderBio(leader);
            return (
              <li key={leader.id} className="text-ink">
                <PhotoTile
                  src={leaderPhotoUrl(leader)}
                  sizes="(min-width: 900px) 30vw, 100vw"
                  className="aspect-[4/5] rounded-[22px]"
                />
                <p className="font-display mt-4 text-3xl">{leader.name}</p>
                <p className="text-gold-ink">{leader.role}</p>
                {bio ? <p className="mt-3 leading-relaxed">{bio}</p> : null}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
