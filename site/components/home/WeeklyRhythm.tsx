import type { Dict } from '@/lib/i18n';
import type { ScheduleItem } from '@/lib/schedule';

const DAY_NAMES: Record<string, string> = {
  SUN: 'SUNDAY', MON: 'MONDAY', TUE: 'TUESDAY', WED: 'WEDNESDAY', THU: 'THURSDAY', FRI: 'FRIDAY', SAT: 'SATURDAY',
};

/** One row of the church's weekly rhythm: the featured gatherings plus the first daily prayer. */
export function pickRhythm(schedule: ScheduleItem[]) {
  const daily = schedule.find((item) => item.cadence === 'DAILY');
  const featured = schedule.filter((item) => item.featured && item.cadence !== 'DAILY');
  return [...(daily ? [daily] : []), ...featured].slice(0, 4);
}

export function WeeklyRhythm({ items, t }: { items: ScheduleItem[]; t: Dict }) {
  if (!items.length) return null;
  return (
    <section aria-label={t.weekly} className="bg-forest-900 text-cream">
      <ul className="mx-auto grid max-w-6xl gap-y-6 px-4 py-10 sm:px-6 min-[600px]:grid-cols-2 min-[1000px]:grid-cols-4">
        {items.map((item) => (
          <li key={item.key} className="flex flex-col gap-1.5 border-l border-gold/40 px-6 py-1">
            <span className="text-xs font-extrabold tracking-[0.2em] text-gold">
              {item.cadence === 'DAILY' ? t.daily : item.cadence === 'MONTHLY' ? t.monthly : t.days[item.day] || DAY_NAMES[item.day] || item.day}
            </span>
            <span className="font-display text-[22px] leading-tight">{item.name}</span>
            <span className="text-sm text-muted-dark">{[item.time, item.detail].filter(Boolean).join(' · ')}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
