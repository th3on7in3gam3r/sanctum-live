import Link from 'next/link';
import { MinistryRow } from '@/components/page/MinistryRow';
import { cmsMetadata, loadCmsPage } from '@/components/CmsArticle';
import { listPublicGroups } from '@/lib/api';
import { huddleJoinUrl } from '@/lib/env';
import { firstParagraph } from '@/lib/pages';
import { getDictionary } from '@/lib/locale';
import { coreDepartments } from '@/data/coreDepartments';

export async function generateMetadata() {
  return cmsMetadata('ministries', 'Ministries at Promised Land Christian Center.');
}

export default async function MinistriesPage() {
  const [page, groups, { t }] = await Promise.all([loadCmsPage('ministries'), listPublicGroups(), getDictionary()]);
  const ministries = groups.filter((group) => group.type === 'MINISTRY');
  const intro = firstParagraph(page);
  const labels = t.pages.ministries;

  return (
    <>
      <header className="bg-forest-900 px-4 py-12 text-on-dark sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-display text-[clamp(3rem,7vw,5.5rem)] font-light leading-none tracking-tight">{page.title}</h1>
          {intro ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#e3dac6] sm:text-lg">{intro}</p> : null}
          <nav aria-label={page.title} className="mt-6 flex flex-wrap gap-2.5">
            {ministries.length ? <Link href="#ministries" className="site-button border border-sand/50 text-on-dark">{labels.explore}</Link> : null}
            <Link href="#core-departments" className="site-button border border-sand/50 text-on-dark">{labels.coreDepartments}</Link>
            <Link href="/huddles" className="site-button bg-gold text-ink">{labels.seeHuddles}</Link>
          </nav>
        </div>
      </header>

      {ministries.length ? (
        <section id="ministries" aria-labelledby="ministries-heading" className="scroll-mt-28 bg-cream px-4 py-10 text-ink sm:px-6 sm:py-14">
          <div className="mx-auto max-w-6xl">
            <h2 id="ministries-heading" className="font-display text-3xl font-light sm:text-4xl">{labels.explore}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {ministries.map((group) => (
                <MinistryRow
                  key={group.id}
                  group={group}
                  huddleHref={group.huddle ? huddleJoinUrl(group.huddle.slug) : null}
                  labels={{ learnMore: labels.learnMore, joinHuddle: labels.joinHuddle }}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="core-departments" aria-labelledby="core-departments-heading" className="scroll-mt-28 border-y border-ink/10 bg-white/50 px-4 py-10 text-ink sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 id="core-departments-heading" className="font-display text-3xl font-light sm:text-4xl">{labels.coreDepartments}</h2>
          <ul lang="en" className="mt-5 grid border-t border-ink/15 md:grid-cols-2 md:gap-x-10">
            {coreDepartments.map((department) => (
              <li key={department.name} className="min-w-0 border-b border-ink/15 py-4 sm:py-5">
                <h3 className="text-base font-semibold leading-snug">{department.name}</h3>
                {department.leads?.length ? (
                  <ul aria-label="Department leadership" className="mt-1.5 space-y-1 text-sm font-semibold text-gold-ink">
                    {department.leads.map((lead) => <li key={lead}>{lead}</li>)}
                  </ul>
                ) : null}
                {department.description ? <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink/80">{department.description}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
