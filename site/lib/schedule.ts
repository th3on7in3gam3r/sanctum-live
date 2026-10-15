import type { PublicServiceTime } from './api';
import type { ServiceTime } from './home';

const HOME_STRIP = ['Sunday', 'Wednesday Upper Room', 'Friday Intercessors'];

export function clock(time: { startLabel: string; endLabel: string }) {
  return `${time.startLabel}–${time.endLabel}`;
}

export function toCard(time: PublicServiceTime): ServiceTime {
  const detail = [time.homeLabel ? time.name : null, time.place, time.note].filter(Boolean).join('. ');
  return {
    day: time.weekday || (time.cadence === 'DAILY' ? 'Daily' : 'Monthly'),
    time: clock(time),
    name: time.homeLabel || time.name,
    line: detail || time.name,
  };
}

export function homeStrip(times: PublicServiceTime[]) {
  const featured = times.filter((time) => time.showOnHome);
  const labels = featured.map((time) => time.homeLabel || time.name);
  return labels.length ? labels : [...HOME_STRIP];
}

export function cardsFromHome(times: ServiceTime[], labels: readonly string[]) {
  return times.filter((time) => labels.includes(time.name));
}
