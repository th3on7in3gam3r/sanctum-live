/** Simple line icon for a church department, picked from words in its name. */
const PATHS: { match: RegExp; d: string }[] = [
  { match: /worship|music|choir/i, d: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' },
  { match: /prayer|intercession/i, d: 'M12 3 8 9v6l-3 3h14l-3-3V9l-4-6Zm0 0v12' },
  { match: /usher|protocol/i, d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-3v6m3-3h-6' },
  { match: /evangel|outreach/i, d: 'M12 22s8-4.5 8-11a8 8 0 1 0-16 0c0 6.5 8 11 8 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' },
  { match: /education|discipleship/i, d: 'M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2V4Zm20 0h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8V4Z' },
  { match: /children/i, d: 'M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 14v-6l-2-4h14l-2 4v6M9 22v-4h6v4' },
  { match: /youth|young/i, d: 'm13 2-9 12h8l-1 8 9-12h-8l1-8Z' },
  { match: /fellowship|\bmen\b|\bwomen\b/i, d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8' },
  { match: /media|communication/i, d: 'M2 7h20v12H2zM7 3l5 4 5-4' },
  { match: /sound|lighting/i, d: 'M11 5 6 9H2v6h4l5 4V5Zm4.5 3.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14' },
  { match: /hospitality|welfare/i, d: 'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5.2 5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7 7-7Z' },
  { match: /technical|facilities|physical/i, d: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5Z' },
  { match: /sanitation|keepers/i, d: 'm3 21 9-9m0 0 3-7 4 4-7 3Zm-4 4-3 3' },
  { match: /finance|treasury/i, d: 'M2 7h20v12H2zM2 11h20M6 15h4' },
  { match: /security|safety/i, d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z' },
  { match: /construction|site/i, d: 'M2 20h20M5 20V9l7-5 7 5v11M9 20v-6h6v6' },
  { match: /admin|pa\b|pastoral/i, d: 'M8 2h8v4H8zM5 4h3m8 0h3v18H5V4Zm4 8h6m-6 4h4' },
];
const FALLBACK = 'M12 2 2 7l10 5 10-5-10-5Zm-10 10 10 5 10-5M2 17l10 5 10-5';

export function DepartmentIcon({ name, className = '' }: { name: string; className?: string }) {
  const d = PATHS.find((p) => p.match.test(name))?.d ?? FALLBACK;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
