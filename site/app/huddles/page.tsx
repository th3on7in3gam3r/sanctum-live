import type { Metadata } from 'next';
import { PageHero } from '@/components/page/PageHero';
import { listJordanRooms, listPublicGroups, type PublicGroup } from '@/lib/api';
import { huddleJoinUrl, jordanRoomUrl } from '@/lib/env';
import { formatKampala } from '@/lib/format';
import { getDictionary } from '@/lib/locale';
import { fill, type Dict } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Live Ka Links',
  description: 'Small gatherings through the week at Promised Land Christian Center.',
};

/** Huddles meet in Jordan; HUDDLES_IN_SANCTUM=true brings back PLCC Sanctum's own room status. */
const SANCTUM_MODE = process.env.HUDDLES_IN_SANCTUM === 'true';

function whatsAppHref(name: string, url: string, t: Dict) {
  const text = fill(t.pages.huddles.shareText, { name, url });
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function whenLabel(group: PublicGroup, t: Dict) {
  if (SANCTUM_MODE && (group.huddle?.status === 'LIVE' || group.huddle?.status === 'WAITING')) return t.pages.huddles.openNow;
  if (group.huddle?.nextStartsAt) {
    return formatKampala(group.huddle.nextStartsAt, { weekday: 'long', hour: 'numeric', minute: '2-digit' });
  }
  return group.meetingTime || t.pages.huddles.tba;
}

export default async function HuddlesPage() {
  const [{ t }, all, rooms] = await Promise.all([getDictionary(), listPublicGroups(), SANCTUM_MODE ? Promise.resolve([]) : listJordanRooms()]);
  const h = t.pages.huddles;
  const groups = all.filter((group) => group.huddle);
  const types = [...new Set(groups.map((group) => group.type))];
  return (
    <>
      <PageHero variant="centered" eyebrow={h.eyebrow} title={h.title} lede={h.lede} />
      <section className="bg-cream px-4 py-12 text-ink sm:px-6">
        <div className="mx-auto max-w-6xl space-y-12">
          {rooms.length ? (
            <div>
              <h2 className="font-display text-4xl font-light">{h.roomsTitle}</h2>
              <ul className="mt-4 divide-y divide-ink/10">
                {rooms.map((room) => {
                  const href = jordanRoomUrl(room.id, room.live);
                  return (
                    <li key={room.id} className="flex flex-col gap-3 py-5 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
                      <div>
                        <p className="font-display text-3xl">{room.name}</p>
                        {room.live ? (
                          <p className="mt-1 inline-flex items-center gap-2 font-semibold text-forest-800">
                            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-live live-pulse" /> {h.openNow}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <a href={href} className={room.live ? 'site-button bg-gold text-ink' : 'site-button border border-ink text-ink'}>
                          {room.live ? h.join : h.openRoom}
                        </a>
                        <a href={whatsAppHref(room.name, jordanRoomUrl(room.id, false), t)} className="site-button border border-ink/30 text-ink">
                          {h.share}
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {groups.length ? (
            <div className="space-y-10">
              {rooms.length ? <h2 className="font-display text-4xl font-light">{h.scheduleTitle}</h2> : null}
              {types.map((type) => (
                <div key={type}>
                  <h3 className={rooms.length ? 'font-display text-2xl' : 'font-display text-4xl font-light'}>{type.charAt(0) + type.slice(1).toLowerCase()}</h3>
                  <ul className="mt-4 divide-y divide-ink/10">
                    {groups.filter((group) => group.type === type).map((group) => {
                      const href = huddleJoinUrl(group.huddle!.slug);
                      return (
                        <li key={group.id} className="flex flex-col gap-3 py-5 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
                          <div>
                            <p className="font-display text-3xl">{group.huddle!.name}</p>
                            <p className="mt-1 text-ink/70">{group.name} · {whenLabel(group, t)}</p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <a href={href} className="site-button bg-gold text-ink">{h.join}</a>
                            <a href={whatsAppHref(group.huddle!.name, href, t)} className="site-button border border-ink text-ink">{h.share}</a>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}

          {groups.length === 0 && rooms.length === 0 ? <p className="py-8 text-lg">{h.none}</p> : null}
        </div>
      </section>
    </>
  );
}
