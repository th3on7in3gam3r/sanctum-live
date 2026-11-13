import Link from 'next/link';
import { PageHero } from '@/components/page/PageHero';
import { prayerJoinUrl } from '@/lib/env';
import { getDictionary } from '@/lib/locale';

export default async function NotFound() {
  const { t } = await getDictionary();
  return (
    <PageHero variant="centered" eyebrow="404" title={t.pages.notFound.title} lede={t.pages.notFound.lede}>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/" className="site-button bg-gold text-ink">{t.pages.notFound.home}</Link>
        <a href={prayerJoinUrl()} className="site-button border border-sand text-on-dark">{t.pages.about.joinLive}</a>
      </div>
    </PageHero>
  );
}
