/** Line icons and small illustrations used on the About page. Pure SVG, no image downloads (kind to mobile data). */

type IconProps = { className?: string };

function Line({ className = 'h-7 w-7', children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export const TargetIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" />
    <path d="M13.5 10.5 20 4M17 4h3v3" />
  </Line>
);

export const EyeIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="3.2" />
  </Line>
);

export const BookIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5z" />
    <path d="M12 6.5v13" />
  </Line>
);

export const CrossIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 2.5v19M7 8h10" />
  </Line>
);

export const DoveIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 13c3 0 5-1 7-3l2-6 2.5 4.5L21 7l-3.5 4.5c-1 4-4.5 7-9 7-1.7 0-3.3-.4-4.5-1.2L7 15c-1.7 0-3-.7-4-2z" />
    <circle cx="15.5" cy="9.5" r=".4" fill="currentColor" />
  </Line>
);

export const PeopleIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="7" r="3" />
    <circle cx="5" cy="9.5" r="2.2" />
    <circle cx="19" cy="9.5" r="2.2" />
    <path d="M6.5 20v-1.5a5.5 5.5 0 0 1 11 0V20M1.5 19v-1a3.6 3.6 0 0 1 5-3.3M22.5 19v-1a3.6 3.6 0 0 0-5-3.3" />
  </Line>
);

export const CalendarIcon = (p: IconProps) => (
  <Line {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2" />
  </Line>
);

export const BroadcastIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="1.8" />
    <path d="M8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7M5.6 18.4a9 9 0 0 1 0-12.8M18.4 5.6a9 9 0 0 1 0 12.8" />
  </Line>
);

export const ArrowIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Line>
);

/** Which icon goes with each belief, matched on its title (falls back by position). */
export function beliefIcon(title: string, index: number) {
  const t = title.toLowerCase();
  if (/scripture|bible|word/.test(t)) return BookIcon;
  if (/jesus|christ|son/.test(t)) return CrossIcon;
  if (/spirit/.test(t)) return DoveIcon;
  if (/church|family|body/.test(t)) return PeopleIcon;
  return [BookIcon, CrossIcon, DoveIcon, PeopleIcon][index % 4];
}

/** "Our story" picture: a seedling rising at sunrise — from a small altar to a growing family. */
export function SeedlingArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 240" className={className} role="img" aria-label="A seedling rising from the soil at sunrise">
      <defs>
        <radialGradient id="seed-sun" cx="62%" cy="38%" r="70%">
          <stop offset="0" stopColor="#fff3cc" />
          <stop offset="0.18" stopColor="#f2c867" />
          <stop offset="0.55" stopColor="#b9792c" />
          <stop offset="1" stopColor="#3b2a14" />
        </radialGradient>
        <linearGradient id="seed-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3220" />
          <stop offset="1" stopColor="#1e140c" />
        </linearGradient>
        <linearGradient id="seed-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b6d36a" />
          <stop offset="1" stopColor="#4f7f2a" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#seed-sun)" />
      <path d="M0 175c40-12 80-16 120-12s60 10 100 6 70-12 100-10v81H0z" fill="#5b4a2a" opacity=".55" />
      <path d="M40 240c10-40 60-62 120-62s110 22 120 62z" fill="url(#seed-soil)" />
      <path d="M160 182c0-22 1-40 4-58" stroke="#5f8a2c" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M163 130c-10-22-34-34-62-30 6 26 30 40 62 30z" fill="url(#seed-leaf)" />
      <path d="M165 118c8-26 34-42 66-40-4 30-30 48-66 40z" fill="url(#seed-leaf)" />
      <path d="M163 130c-16-8-32-14-48-20M165 118c14-10 30-20 48-28" stroke="#3e6a20" strokeWidth="1.4" fill="none" opacity=".6" />
    </svg>
  );
}
