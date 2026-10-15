import Link from 'next/link';
import { YoutubeFacade } from '@/components/YoutubeFacade';
import { GlowPhoto } from '@/components/GlowPhoto';
import { formatDay } from '@/lib/format';
import type { PublicSermon } from '@/lib/api';
import { Reveal } from '@/components/home/Reveal';

export function LatestMessage({ sermon }: { sermon: PublicSermon }) {
  return (
    <section className="bg-forest-950 px-4 py-20 text-on-dark sm:px-6">
      <Reveal className="mx-auto grid max-w-6xl items-center gap-10 min-[900px]:grid-cols-2">
        {sermon.youtubeUrl ? (
          <YoutubeFacade url={sermon.youtubeUrl} title={sermon.title} />
        ) : (
          <GlowPhoto src={null} alt="" sizes="(min-width: 900px) 40vw, 100vw" className="aspect-video" />
        )}
        <div>
          <p className="text-sm text-gold-light">
            {formatDay(sermon.preachedOn)}{sermon.scripture ? ` · ${sermon.scripture}` : ''}
          </p>
          <h2 className="font-display mt-3 text-[52px] font-light leading-none">{sermon.title}</h2>
          <p className="mt-4 text-sand">{sermon.speaker}{sermon.seriesName ? ` · ${sermon.seriesName}` : ''}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/sermons/${sermon.id}`} className="site-button bg-gold text-ink">
              {sermon.youtubeUrl ? 'Watch' : 'Listen'}
            </Link>
            {sermon.audioUrl ? (
              <a href={sermon.audioUrl} className="site-button border border-sand text-on-dark">Listen (audio only)</a>
            ) : (
              <Link href={`/sermons/${sermon.id}`} className="site-button border border-sand text-on-dark">Listen (audio only)</Link>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
