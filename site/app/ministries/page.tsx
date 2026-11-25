import Link from 'next/link';
import { MinistryRow } from '@/components/page/MinistryRow';
import { DepartmentIcon } from '@/components/page/DepartmentIcon';
import { cmsMetadata, loadCmsPage } from '@/components/CmsArticle';
import { listPublicGroups } from '@/lib/api';
import { huddleJoinUrl } from '@/lib/env';
import { firstParagraph } from '@/lib/pages';
import { getDictionary } from '@/lib/locale';
import { coreDepartments } from '@/data/coreDepartments';

export async function generateMetadata() {
  return cmsMetadata('ministries', 'Ministries at Promised Land Christian Center.');
}

/** "Worship and Music Department (Choir / Praise Team)" → title + "Choir / Praise Team". */
function splitName(name: string): { title: string; aka: string | null } {
  const m = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return m ? { title: m[1], aka: m[2] } : { title: name, aka: null };
}

/** "National · Patience Kabibi" → role "National", person "Patience Kabibi". */
function splitLead(lead: string): { role: string | null; person: string } {
  const [role, person] = lead.split(' · ');
  return person ? { role, person } : { role: null, person: lead };
}

function initials(person: string): string {
  const words = person.replace(/^(Mrs?|Ms|Ps|Ap|Dr|Pr)\.\s*/i, '').trim().split(/\s+/);
  return ((words[0]?.[0] || '') + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase() || '·';
}

export default async function MinistriesPage() {
  const [page, groups, { t }] = await Promise.all([loadCmsPage('ministries'), listPublicGroups(), getDictionary()]);
  const ministries = groups.filter((group) => group.type === 'MINISTRY');
  const intro = firstParagraph(page);
  const labels = t.pages.ministries;

  return (
    <>
      <header className="relative overflow-hidden bg-forest-900 px-4 pb-14 pt-12 text-on-dark sm:px-6 sm:pb-20 sm:pt-16">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(201,163,90,.22),transparent_65%)]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">{labels.eyebrow}</p>
          <h1 className="mt-3 font-display text-[clamp(2.75rem,6.5vw,5rem)] font-light leading-[0.95] tracking-tight">{page.title}</h1>
          {intro ? <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#e3dac6] sm:text-lg">{intro}</p> : null}
          <nav aria-label={page.title} className="mt-8 flex flex-wrap gap-2.5">
            {ministries.length ? <Link href="#ministries" className="site-button border border-sand/40 text-on-dark hover:bg-white/5">{labels.explore}</Link> : null}
            <Link href="#core-departments" className="site-button border border-sand/40 text-on-dark hover:bg-white/5">{labels.coreDepartments}</Link>
            <Link href="/huddles" className="site-button bg-gold text-ink">{labels.seeHuddles}</Link>
          </nav>
        </div>
      </header>

      {ministries.length ? (
        <section id="ministries" aria-labelledby="ministries-heading" className="scroll-mt-28 bg-cream px-4 py-14 text-ink sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 id="ministries-heading" className="font-display text-3xl font-light tracking-tight sm:text-[2.6rem]">{labels.explore}</h2>
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

      <section id="core-departments" aria-labelledby="core-departments-heading" className="scroll-mt-28 border-t border-ink/10 bg-[#f4efe4] px-4 py-14 text-ink sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div className="max-w-2xl">
              <h2 id="core-departments-heading" className="font-display text-3xl font-light tracking-tight sm:text-[2.6rem]">{labels.coreDepartments}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/70">{labels.departmentsIntro}</p>
            </div>
          </div>

          <ul lang="en" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coreDepartments.map((department) => {
              const { title, aka } = splitName(department.name);
              return (
                <li key={department.name} className="flex min-w-0 flex-col rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_1px_2px_rgba(22,37,31,.04)]">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-900 text-gold">
                      <DepartmentIcon name={department.name} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold leading-snug">{title}</h3>
                      {aka ? <p className="mt-0.5 text-[13px] text-ink/55">{aka}</p> : null}
                    </div>
                  </div>
                  {department.description ? <p className="mt-3 text-sm leading-relaxed text-ink/70">{department.description}</p> : null}
                  {department.leads?.length ? (
                    <div className="mt-auto pt-4">
                      <ul aria-label={labels.ledBy} className="space-y-2 border-t border-ink/10 pt-3.5">
                        {department.leads.map((lead) => {
                          const { role, person } = splitLead(lead);
                          return (
                            <li key={lead} className="flex items-center gap-2.5">
                              <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20 text-[11px] font-bold text-gold-ink">
                                {initials(person)}
                              </span>
                              <span className="min-w-0 leading-tight">
                                <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink/45">{role || labels.ledBy}</span>
                                <span className="block truncate text-sm font-semibold">{person}</span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
