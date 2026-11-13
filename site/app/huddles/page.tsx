import type { Metadata } from 'next';
import { PageHero } from '@/components/page/PageHero';
import { listPublicGroups, type PublicGroup } from '@/lib/api';
import { siteEnv } from '@/lib/env';
import { formatKampala } from '@/lib/format';
import { getDictionary } from '@/lib/locale';
import { fill, type Dict } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Live huddles',
  description: 'Small gatherings through the week at Promised Land Christian Center.',
};

function joinHref(slug: string) {
  return `${siteEnv().sanctumAppUrl}/join/${slug}`;
}

function whatsAppHref(name: string, slug: string, t: Dict) {
  const text = fill(t.pages.huddles.shareText, { name, url: joinHref(slug) });
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function whenLabel(group: PublicGroup, t: Dict) {
  if (group.huddle?.status === 'LIVE' || group.huddle?.status === 'WAITING') return t.pages.huddles.openNow;
  if (group.huddle?.nextStartsAt) {
    return formatKampala(group.huddle.nextStartsAt, { weekday: 'long', hour: 'numeric', minute: '2-digit' });
  }
  return group.meetingTime || t.pages.huddles.tba;
}

export default async function HuddlesPage() {
  const [{ t }, all] = await Promise.all([getDictionary(), listPublicGroups()]);
  const h = t.pages.huddles;
  const groups = all.filter((group) => group.huddle);
  const types = [...new Set(groups.map((group) => group.type))];
  return (
    <>
      <PageHero
        variant="centered"
        eyebrow={h.eyebrow}
        title={h.title}
        lede={h.lede}
      />
      <section className="bg-cream px-4 py-12 text-ink sm:px-6">
        <div className="mx-auto max-w-6xl space-y-12">
          {types.map((type) => (
            <div key={type}>
              <h2 className="font-display text-4xl font-light">{type.charAt(0) + type.slice(1).toLowerCase()}</h2>
              <ul className="mt-4 divide-y divide-ink/10">
                {groups.filter((group) => group.type === type).map((group) => {
                  const href = joinHref(group.huddle!.slug);
                  return (
                    <li key={group.id} className="flex flex-col gap-3 py-5 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
                      <div>
                        <p className="font-display text-3xl">{group.huddle!.name}</p>
                        <p className="mt-1 text-ink/70">{group.name} · {whenLabel(group, t)}</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <a href={href} className="site-button bg-gold text-ink">{h.join}</a>
                        <a href={whatsAppHref(group.huddle!.name, group.huddle!.slug, t)} className="site-button border border-ink text-ink">{h.share}</a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {groups.length === 0 ? <p className="py-8 text-lg">{h.none}</p> : null}
        </div>
      </section>
    </>
  );
}
