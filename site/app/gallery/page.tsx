import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/page/PageHero';
import { AlbumCard, FeaturedMosaic } from '@/components/gallery/AlbumGrid';
import { VideoTile } from '@/components/gallery/VideoTile';
import { listPublicAlbums, listPublicVideos } from '@/lib/api';
import { getDictionary } from '@/lib/locale';
import { label } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Worship, baptisms, conferences and Sundays together, captured by our media team.',
};


export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const [query, { t }] = await Promise.all([searchParams, getDictionary()]);
  const g = t.pages.gallery;
  const filters = [
    { label: g.all, value: '' },
    { label: g.services, value: 'SERVICE' },
    { label: label(t, 'Events'), value: 'EVENT' },
    { label: label(t, 'Ministries'), value: 'MINISTRY' },
    { label: g.videos, value: 'VIDEOS' },
  ];
  const category = query.category || '';
  const page = Math.max(1, Number(query.page || 1) || 1);
  const albums = category === 'VIDEOS' ? { albums: [], hasMore: false, moments: [] } : await listPublicAlbums(`?page=${page}${category ? `&category=${category}` : ''}`);
  const videos = category === 'VIDEOS' || category === '' ? await listPublicVideos(page) : { videos: [], hasMore: false };
  const featured = albums.albums.filter((album) => album.isFeatured);
  const mosaic = (featured.length ? featured : albums.albums).slice(0, 8);

  return (
    <div className="bg-cream text-ink">
      <PageHero fitTitle variant="centered" eyebrow={label(t, 'Gallery')} title={g.titleA} accent={g.titleB} lede={g.lede} />
      <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-6">
        {filters.map((filter) => (
          <Link
            key={filter.label}
            href={filter.value ? `/gallery?category=${filter.value}` : '/gallery'}
            aria-current={category === filter.value ? 'page' : undefined}
            className={`inline-flex items-center rounded-full border px-[18px] py-[10px] text-[15px] font-semibold ${category === filter.value ? 'border-ink bg-ink text-cream' : 'border-ink/25 bg-transparent text-ink'}`}
          >
            {filter.label}
          </Link>
        ))}
      </div>
      {albums.albums.length || videos.videos.length ? (
        <div className="mx-auto max-w-6xl space-y-10 px-4 pb-16">
          {category !== 'VIDEOS' && page === 1 ? <FeaturedMosaic albums={mosaic} /> : null}
          {category !== 'VIDEOS' ? (
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
              {albums.albums.map((album) => <AlbumCard key={album.id} album={album} />)}
            </div>
          ) : null}
          {videos.videos.length ? (
            <div className="flex gap-3 overflow-x-auto">
              {videos.videos.map((video) => <div key={video.id} className="w-44 shrink-0 sm:w-56"><VideoTile video={video} /></div>)}
            </div>
          ) : null}
          {albums.hasMore || videos.hasMore ? <Link className="site-button inline-flex bg-forest-900 text-on-dark" href={`/gallery?category=${category}&page=${page + 1}`}>{t.pages.sermons.loadMore}</Link> : null}
        </div>
      ) : (
        <p className="mx-auto max-w-xl px-4 py-20 text-center font-display text-3xl">{g.empty}</p>
      )}
    </div>
  );
}
