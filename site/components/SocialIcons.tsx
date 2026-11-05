import { church } from '@/lib/church';

type Social = { label: string; href: string; path: React.ReactNode; fill?: boolean };

/** The church's social accounts. Facebook and Instagram show once their links are set in lib/church.ts. */
function socials(): Social[] {
  const list: Social[] = [
    {
      label: `YouTube ${church.youtubeLabel}`,
      href: church.youtube,
      fill: true,
      path: <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />,
    },
    {
      label: `TikTok ${church.tiktokLabel}`,
      href: church.tiktok,
      fill: true,
      path: <path d="M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2-2.8V9.1a6.3 6.3 0 1 0 5.4 6.3V8.6a8 8 0 0 0 4.4 1.4V6.6a4.6 4.6 0 0 1-4.4-4.6z" />,
    },
    {
      label: 'WhatsApp',
      href: church.whatsapp,
      fill: true,
      path: <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.3-.2-.6-.3z" />,
    },
  ];
  if (church.facebook) {
    list.push({
      label: 'Facebook',
      href: church.facebook,
      fill: true,
      path: <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />,
    });
  }
  if (church.instagram) {
    list.push({
      label: 'Instagram',
      href: church.instagram,
      path: (
        <>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </>
      ),
    });
  }
  return list;
}

export function SocialIcons({ className = '' }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2.5 ${className}`} aria-label="Follow Promised Land Christian Center">
      {socials().map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            aria-label={s.label}
            title={s.label}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold-light transition-colors hover:bg-gold hover:text-ink"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill={s.fill ? 'currentColor' : 'none'}
              stroke={s.fill ? 'none' : 'currentColor'}
              strokeWidth="1.8"
            >
              {s.path}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
