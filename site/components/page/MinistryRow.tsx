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
    <article id={groupAnchor(group.name)} className="flex scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white/60">
      {image ? (
        <PhotoTile src={image} sizes="(min-width: 640px) 50vw, 100vw" className="aspect-[2/1] w-full" />
      ) : null}
      <div className="flex flex-1 flex-col p-5 sm:p-7">
        <h3 className="font-display text-3xl font-light leading-tight sm:text-4xl">{group.name}</h3>
        {group.publicDescription ? <p className="mt-3 leading-relaxed text-ink/80">{group.publicDescription}</p> : null}
        {group.meetingTime ? <p className="mt-3 text-sm font-semibold">{group.meetingTime}</p> : null}
        <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-5 text-sm font-semibold text-gold-ink">
          <a href={href} className="underline decoration-gold/70 underline-offset-4">{labels?.learnMore ?? 'Learn more'}</a>
          {huddleHref ? <a href={huddleHref} className="underline decoration-gold/70 underline-offset-4">{labels?.joinHuddle ?? 'Join the live Ka Link'}</a> : null}
        </div>
      </div>
    </article>
  );
}
