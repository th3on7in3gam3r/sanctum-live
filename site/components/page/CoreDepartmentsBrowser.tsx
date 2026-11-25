'use client';

import { useMemo, useState } from 'react';
import { DepartmentIcon } from '@/components/page/DepartmentIcon';
import type { CoreDepartment, DepartmentCategory } from '@/data/coreDepartments';

export type DepartmentLabels = {
  searchDepartments: string;
  allDepartments: string;
  noDepartment: string;
  lead: string;
  categories: Record<DepartmentCategory, { title: string; text: string }>;
};

const CATEGORY_ICON: Record<DepartmentCategory, string> = {
  spiritual: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Zm0 0c0-4 2-8 7-11',
  community: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  operations: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2.2-1.3L14.4 3h-4l-.4 2.4a7.5 7.5 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2.2 1.3l.4 2.4h4l.4-2.4a7.5 7.5 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3Z',
  administration: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6M9 10h.01M15 10h.01',
};

/** "Worship and Music Department (Choir / Praise Team)" → title + "Choir / Praise Team". */
function splitName(name: string): { title: string; aka: string | null } {
  const m = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return m ? { title: m[1], aka: m[2] } : { title: name, aka: null };
}

export function CoreDepartmentsBrowser({
  departments,
  categories,
  labels,
}: {
  departments: readonly CoreDepartment[];
  categories: readonly DepartmentCategory[];
  labels: DepartmentLabels;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<DepartmentCategory | 'all'>('all');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => active === 'all' || c === active)
      .map((c) => ({
        category: c,
        items: departments.filter(
          (d) =>
            d.category === c &&
            (!q ||
              d.name.toLowerCase().includes(q) ||
              (d.description || '').toLowerCase().includes(q) ||
              (d.leads || []).some((l) => l.toLowerCase().includes(q)))
        ),
      }))
      .filter((g) => g.items.length);
  }, [departments, categories, query, active]);

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative block lg:w-80 lg:shrink-0">
          <span className="sr-only">{labels.searchDepartments}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink/50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.searchDepartments}
            className="h-12 w-full rounded-full border border-ink/15 bg-white pl-11 pr-4 text-[15px] text-ink outline-none placeholder:text-ink/45 focus:border-gold"
          />
        </label>
        <div role="radiogroup" aria-label={labels.allDepartments} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
          {(['all', ...categories] as const).map((c) => {
            const on = active === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setActive(c)}
                className={`h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${
                  on ? 'border-forest-900 bg-forest-900 text-on-dark' : 'border-ink/15 bg-white text-ink hover:border-gold'
                }`}
              >
                {c === 'all' ? labels.allDepartments : labels.categories[c].title}
              </button>
            );
          })}
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-ink/10 bg-white p-8 text-center text-ink/70" role="status">{labels.noDepartment}</p>
      ) : null}

      {groups.map(({ category, items }) => (
        <section key={category} aria-labelledby={`cat-${category}`} className="mt-10 first:mt-9">
          <div className="flex items-start gap-3">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 h-8 w-8 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d={CATEGORY_ICON[category]} />
            </svg>
            <div>
              <h3 id={`cat-${category}`} className="font-display text-2xl font-medium leading-tight">{labels.categories[category].title}</h3>
              <p className="mt-0.5 text-sm text-ink/70">{labels.categories[category].text}</p>
            </div>
          </div>
          <ul lang="en" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((d) => {
              const { title, aka } = splitName(d.name);
              return (
                <li key={d.name} className="flex min-w-0 flex-col rounded-2xl border border-ink/10 bg-white/90 p-5 shadow-[0_1px_2px_rgba(22,37,31,.04),0_10px_24px_-18px_rgba(22,37,31,.35)]">
                  <div className="flex items-start gap-3">
                    <DepartmentIcon name={d.name} className="mt-0.5 h-7 w-7 shrink-0 text-gold" />
                    <div className="min-w-0">
                      <h4 className="font-display text-lg font-semibold leading-snug">{title}</h4>
                      {aka ? <p className="text-xs text-ink/55">{aka}</p> : null}
                      {d.description ? <p className="mt-1.5 text-[13px] leading-relaxed text-ink/70">{d.description}</p> : null}
                    </div>
                  </div>
                  <div className="mt-auto pt-4">
                    <div className="border-t border-ink/10 pt-3 text-[13px] leading-snug">
                      {d.leads?.length ? (
                        d.leads.map((lead) => (
                          <p key={lead}>
                            <span className="font-semibold text-ink/60">{labels.lead}:</span>{' '}
                            <span className="font-semibold text-ink">{lead}</span>
                          </p>
                        ))
                      ) : (
                        <p><span className="font-semibold text-ink/60">{labels.lead}:</span> <span className="text-ink/45">—</span></p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
