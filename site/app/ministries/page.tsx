import Image from 'next/image';
import Link from 'next/link';
import { MinistryRow } from '@/components/page/MinistryRow';
import { CoreDepartmentsBrowser } from '@/components/page/CoreDepartmentsBrowser';
import { cmsMetadata, loadCmsPage } from '@/components/CmsArticle';
import { listPublicGroups } from '@/lib/api';
import { huddleJoinUrl } from '@/lib/env';
import { getDictionary } from '@/lib/locale';
import { coreDepartments, DEPARTMENT_CATEGORIES } from '@/data/coreDepartments';

export async function generateMetadata() {
  return cmsMetadata('ministries', 'Ministries at Promised Land Christian Center.');
}

export default async function MinistriesPage() {
  const [, groups, { t }] = await Promise.all([loadCmsPage('ministries'), listPublicGroups(), getDictionary()]);
  const ministries = groups.filter((group) => group.type === 'MINISTRY');
  const labels = t.pages.ministries;

  return (
    <>
      {/* Hero: cross and open Bible at sunrise, text on the dark green side */}
      <header className="relative isolate overflow-hidden bg-forest-900 text-on-dark">
        <Image
          src="/ministries-hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[78%_center]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,40,27,.92)_0%,rgba(8,40,27,.72)_42%,rgba(8,40,27,.15)_72%,transparent_100%)] max-sm:bg-[linear-gradient(180deg,rgba(8,40,27,.55)_0%,rgba(8,40,27,.88)_70%)]" />
        <div className="mx-auto flex min-h-[22rem] max-w-6xl flex-col justify-center px-4 py-14 sm:min-h-[26rem] sm:px-6 sm:py-20">
          <p className="font-display text-lg text-gold sm:text-xl">{labels.heroEyebrow}</p>
          <h1 className="mt-2 max-w-xl font-display text-[clamp(2.4rem,5.5vw,3.9rem)] font-semibold leading-[1.05] tracking-tight">
            {labels.heroTitle1}
            <br />
            {labels.heroTitle2}
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#ece4d1] sm:text-[17px]">{labels.heroIntro}</p>
          <nav aria-label={labels.heroEyebrow} className="mt-7 flex flex-wrap gap-3">
            <Link href="#core-departments" className="site-button bg-gold px-6 text-ink shadow-[0_8px_20px_-10px_rgba(201,163,90,.8)]">
              {labels.findMinistry} <span aria-hidden="true">›</span>
            </Link>
            <Link href="/contact" className="site-button border border-on-dark/70 px-6 text-on-dark hover:bg-white/10">
              {labels.getInvolved}
            </Link>
          </nav>
        </div>
      </header>

      <section
        id="core-departments"
        aria-labelledby="core-departments-heading"
        className="scroll-mt-28 bg-cream bg-[radial-gradient(120%_60%_at_100%_0%,rgba(201,163,90,.12),transparent_60%),radial-gradient(90%_50%_at_0%_10%,rgba(201,163,90,.08),transparent_60%)] px-4 py-14 text-ink sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="core-departments-heading" className="font-display text-[clamp(2.2rem,4.5vw,3rem)] font-semibold tracking-tight">{labels.coreDepartments}</h2>
            <div aria-hidden="true" className="mt-3 flex items-center justify-center gap-3 text-gold">
              <span className="h-px w-16 bg-gold/70" />
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18M7 8h10" />
              </svg>
              <span className="h-px w-16 bg-gold/70" />
            </div>
            <p className="mt-4 text-base leading-relaxed text-ink/75">
              {labels.departmentsLead.replace('{count}', String(coreDepartments.length))}
            </p>
          </div>

          <CoreDepartmentsBrowser
            departments={coreDepartments}
            categories={DEPARTMENT_CATEGORIES}
            labels={{
              searchDepartments: labels.searchDepartments,
              allDepartments: labels.allDepartments,
              noDepartment: labels.noDepartment,
              lead: labels.lead,
              categories: {
                spiritual: { title: labels.catSpiritual, text: labels.catSpiritualText },
                community: { title: labels.catCommunity, text: labels.catCommunityText },
                operations: { title: labels.catOperations, text: labels.catOperationsText },
                administration: { title: labels.catAdministration, text: labels.catAdministrationText },
              },
            }}
          />
        </div>
      </section>

      {ministries.length ? (
        <section id="ministries" aria-labelledby="ministries-heading" className="scroll-mt-28 border-t border-ink/10 bg-[#f4efe4] px-4 py-14 text-ink sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <h2 id="ministries-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{labels.explore}</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      <section className="bg-cream px-4 pb-16 pt-4 sm:px-6 sm:pb-20">
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-5 overflow-hidden rounded-3xl bg-forest-900 px-6 py-8 text-on-dark sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[radial-gradient(60%_100%_at_70%_100%,rgba(201,163,90,.18),transparent_70%)]" />
          <div className="relative flex items-center gap-5">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="hidden h-12 w-12 shrink-0 text-gold sm:block" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
            </svg>
            <div>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">{labels.ctaTitle}</h2>
              <p className="mt-1 text-[#e3dac6]">{labels.ctaText}</p>
            </div>
          </div>
          <Link href="/contact" className="site-button relative bg-gold px-6 text-ink">
            {labels.getInvolved} <span aria-hidden="true">›</span>
          </Link>
        </div>
      </section>
    </>
  );
}
