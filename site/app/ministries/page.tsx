import Link from 'next/link';
import { MinistryRow, groupAnchor } from '@/components/page/MinistryRow';
import { PageHero } from '@/components/page/PageHero';
import { cmsMetadata, loadCmsPage } from '@/components/CmsArticle';
import { listPublicGroups } from '@/lib/api';
import { huddleJoinUrl } from '@/lib/env';
import { firstParagraph } from '@/lib/pages';
import { getDictionary } from '@/lib/locale';
import { label } from '@/lib/i18n';
import { coreDepartments } from '@/data/coreDepartments';

export async function generateMetadata() {
  return cmsMetadata('ministries', 'Ministries at Promised Land Christian Center.');
}

export default async function MinistriesPage() {
  const [page, groups, { t }] = await Promise.all([loadCmsPage('ministries'), listPublicGroups(), getDictionary()]);
  const ministries = groups.filter((group) => group.type === 'MINISTRY');
  return (
    <>
      <PageHero
        variant="centered"
        eyebrow={label(t, 'Ministries')}
        title={page.title}
        lede={firstParagraph(page)}
        jumps={[
          { href: '#core-departments', label: 'Core Departments' },
          ...ministries.map((group) => ({ href: `#${groupAnchor(group.name)}`, label: group.name })),
        ]}
      />
      <section className="bg-cream px-4 text-ink sm:px-6">
        <div className="mx-auto max-w-6xl divide-y divide-ink/10">
          {ministries.map((group, index) => (
            <MinistryRow
              key={group.id}
              group={group}
              index={index}
              huddleHref={group.huddle ? huddleJoinUrl(group.huddle.slug) : null}
              labels={{ learnMore: t.pages.ministries.learnMore, joinHuddle: t.pages.ministries.joinHuddle }}
            />
          ))}
        </div>
      </section>
      <section id="core-departments" aria-labelledby="core-departments-heading" lang="en" className="scroll-mt-28 bg-cream px-4 py-14 text-ink sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl border-t border-ink/10 pt-10">
          <h2 id="core-departments-heading" className="font-display text-4xl font-light sm:text-5xl">Core Departments</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coreDepartments.map((department) => (
              <li key={department.name} className="rounded-2xl border border-ink/10 bg-white/60 p-5">
                <h3 className="text-lg font-semibold leading-snug">{department.name}</h3>
                {department.leads?.length ? (
                  <ul aria-label="Department leadership" className="mt-2 space-y-1 text-sm font-semibold">
                    {department.leads.map((lead) => <li key={lead}>{lead}</li>)}
                  </ul>
                ) : null}
                {department.description ? <p className="mt-3 text-sm leading-relaxed text-ink/80">{department.description}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="bg-forest-900 px-4 py-16 text-on-dark sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
          <h2 className="font-display text-5xl font-light">{t.pages.events.liveHuddles}</h2>
          <Link href="/huddles" className="site-button bg-gold text-ink">{t.pages.ministries.seeHuddles}</Link>
        </div>
      </section>
    </>
  );
}
