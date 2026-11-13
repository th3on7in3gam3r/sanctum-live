import type { Metadata } from 'next';
import { prayerJoinUrl } from '@/lib/env';
import { getDictionary } from '@/lib/locale';
import { label } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Live prayer',
  description: 'Join Promised Land Christian Center for live prayer in Sanctum.',
};

export default async function PrayerPage() {
  const href = prayerJoinUrl();
  const { t } = await getDictionary();
  return (
    <article className="page-wrap space-y-5">
      <h1 className="page-title">{label(t, 'Live prayer')}</h1>
      <p className="text-lg leading-relaxed">
        {t.pages.prayer.p1}
      </p>
      <p className="text-lg leading-relaxed">
        {t.pages.prayer.p2}
      </p>
      <a href={href} className="site-button bg-gold text-ink">
        {t.pages.about.joinLive}
      </a>
    </article>
  );
}
