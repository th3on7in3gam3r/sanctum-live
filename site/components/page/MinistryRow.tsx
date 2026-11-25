import { PhotoTile } from '@/components/page/PhotoTile';
import type { PublicGroup } from '@/lib/api';

const imageFallbacks: Record<string, string> = {
  Children: '/ministry-children.jpg',
  Youth: '/ministry-youth.jpg',
  Worship: '/ministry-worship.jpg',
  Outreach: '/ministry-outreach.jpg',
};

function ministryImageUrl(group: Pick<PublicGroup, 'name' | 'imageUrl'>) {
  if (group.imageUrl) return group.imageUrl;
  for (const [key, path] of Object.entries(imageFallbacks)) {
    if (group.name.includes(key)) return path;
  }
  return null;
}

export function groupAnchor(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'group';
}

export function MinistryRow({ group, href = '/visit', huddleHref, labels }: {
  group: PublicGroup;
  href?: string;
  huddleHref?: string | null;
  labels?: { learnMore: string; joinHuddle: string };
}) {
  const image = ministryImageUrl(group);

  return (
    <article
      id={groupAnchor(group.name)}
      className="group flex scroll-mt-28 flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_1px_2px_rgba(22,37,31,.05),0_12px_32px_-18px_rgba(22,37,31,.25)] transition-shadow hover:shadow-[0_1px_2px_rgba(22,37,31,.06),0_18px_40px_-16px_rgba(22,37,31,.32)]"
    >
      {image ? (
        <PhotoTile src={image} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="aspect-[4/3] w-full" />
      ) : null}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-2xl font-normal leading-tight tracking-tight">{group.name}</h3>
        {group.publicDescription ? <p className="mt-2 text-[15px] leading-relaxed text-ink/75">{group.publicDescription}</p> : null}
        {group.meetingTime ? (
          <p className="mt-4 inline-flex items-start gap-2 self-start rounded-xl bg-forest-900/[0.06] px-3 py-2 text-[13px] font-semibold text-ink/85">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-px h-4 w-4 shrink-0 text-gold-ink" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {group.meetingTime}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
          {huddleHref ? (
            <a href={huddleHref} className="site-button min-h-[2.5rem] bg-forest-900 px-4 text-sm text-on-dark">
              {labels?.joinHuddle ?? 'Join the live Ka Link'}
            </a>
          ) : null}
          <a href={href} className="inline-flex min-h-[2.5rem] items-center gap-1 text-sm font-semibold text-gold-ink">
            {labels?.learnMore ?? 'Learn more'}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>
      </div>
    </article>
  );
}
