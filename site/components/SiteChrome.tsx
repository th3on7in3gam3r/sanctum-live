'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { BrandLockup } from '@plcc/brand/BrandLockup';
import { BRAND } from '@plcc/brand/brand';
import { church } from '@/lib/church';
import { footerNav, MAIN_NAV, type NavLink } from '@/lib/nav';
import { SocialIcons } from '@/components/SocialIcons';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { LanguageOffer } from '@/components/i18n/LanguageOffer';
import { fill, label, type Dict, type Locale } from '@/lib/i18n';

function LiveDot({ pulse = false }: { pulse?: boolean }) {
  return <span className={`inline-block h-2 w-2 rounded-full bg-live ${pulse ? 'live-pulse' : ''}`} aria-hidden="true" />;
}

function isCurrent(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

function NavAnchor({
  link,
  className,
  current,
  onClick,
  children,
}: {
  link: NavLink;
  className?: string;
  current?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (link.href.startsWith('/')) {
    return (
      <Link href={link.href} className={className} onClick={onClick} aria-current={current ? 'page' : undefined}>
        {children}
      </Link>
    );
  }
  return (
    <a href={link.href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}

export function SiteChrome({ children, locale, t, offer = [], prayerUrl, oneUrl, staffLoginUrl, serviceStrip = [], liveNow = false }: { children: React.ReactNode; locale: Locale; t: Dict; offer?: Locale[]; prayerUrl: string; oneUrl?: string; staffLoginUrl: string; serviceStrip?: string[]; liveNow?: boolean }) {
  const path = usePathname();
  const home = path === '/';
  const [open, setOpen] = useState(false);
  const footer = footerNav(prayerUrl, oneUrl);
  const livePrayer = footer.gather.find((link) => link.label === 'Live prayer');
  const give = footer.gather.find((link) => link.label === 'Give');
  const sticky = footer.gather.filter((link) => link.label !== 'Events' && link.label !== 'Ka Links');

  return (
    <div className={home ? 'bg-forest-900 text-on-dark' : 'bg-cream text-ink'}>
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-cream focus:px-3 focus:py-2 focus:text-ink">
        {t.skip}
      </a>
      <header className={`z-40 ${home ? 'absolute inset-x-0 top-0' : 'bg-forest-900 text-on-dark'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-5 sm:px-6">
          <BrandLockup size="md" href="/" className="shrink-0 whitespace-nowrap" />
          <nav className="hidden items-center gap-4 text-sm text-on-dark min-[1300px]:flex" aria-label="Primary">
            {MAIN_NAV.map((link) => {
              const current = isCurrent(path, link.href);
              return (
                <NavAnchor key={link.href} link={link} current={current} className={current ? 'text-gold-light' : 'hover:text-gold-light'}>
                  {label(t, link.label)}
                </NavAnchor>
              );
            })}
            {oneUrl ? (
              <NavAnchor link={{ label: 'Sign in', href: oneUrl }} className="site-button border border-sand/40 px-4 text-on-dark">
                {liveNow ? <LiveDot pulse /> : null} {liveNow ? t.liveNow : t.signIn}
              </NavAnchor>
            ) : livePrayer ? (
              <NavAnchor link={livePrayer} className="site-button border border-sand/40 px-4 text-on-dark">
                <LiveDot pulse={liveNow} /> {liveNow ? t.liveNow : label(t, livePrayer.label)}
              </NavAnchor>
            ) : null}
            {give ? (
              <NavAnchor link={give} className="site-button bg-gold px-4 text-ink">{label(t, give.label)}</NavAnchor>
            ) : null}
            <LanguageSwitcher locale={locale} label={t.language} variant="short" />
          </nav>
          <button
            type="button"
            className="site-button mobile-only border border-sand/40 px-4 text-sm text-on-dark"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            {t.menu}
          </button>
        </div>
      </header>
      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-forest-950 px-6 py-8 text-on-dark min-[1300px]:hidden">
          <div className="flex items-center justify-between">
            <BrandLockup size="sm" href="/" />
            <button type="button" className="site-button border border-sand/40 px-4" onClick={() => setOpen(false)}>{t.close}</button>
          </div>
          <nav className="mt-10 flex flex-col gap-5 text-3xl font-display" aria-label="Mobile">
            {MAIN_NAV.map((link) => {
              const current = isCurrent(path, link.href);
              return (
                <NavAnchor key={link.href} link={link} current={current} onClick={() => setOpen(false)} className={current ? 'text-gold-light' : undefined}>
                  {label(t, link.label)}
                </NavAnchor>
              );
            })}
            {oneUrl ? <NavAnchor link={{ label: 'Sign in to PLCC ONE', href: oneUrl }} onClick={() => setOpen(false)}>{t.signInOne}</NavAnchor> : null}
            {livePrayer ? <NavAnchor link={livePrayer} onClick={() => setOpen(false)}>{label(t, livePrayer.label)}</NavAnchor> : null}
            {give ? <NavAnchor link={give} onClick={() => setOpen(false)}>{label(t, give.label)}</NavAnchor> : null}
          </nav>
          <LanguageSwitcher locale={locale} label={t.language} variant="list" className="mt-auto pt-10" />
        </div>
      ) : null}
      <main id="content">{children}</main>
      <LanguageOffer offer={offer} />
      <footer className="bg-footer text-on-dark">
        <BookingBand t={t} />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Brand + follow / language: one tidy row on desktop */}
          <div className="flex flex-col gap-6 border-b border-white/10 py-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <BrandLockup size="md" />
              <p className="mt-3 font-display text-base italic text-sand/80">{BRAND.tagline}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 lg:gap-6">
              <SocialIcons />
              <span className="hidden h-8 w-px bg-white/10 lg:block" aria-hidden="true" />
              <LanguageSwitcher locale={locale} label={t.language} variant="segmented" />
            </div>
          </div>

          {/* Four even columns on desktop; Gather + Explore side by side on phones */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-12 lg:grid-cols-12 lg:gap-x-10">
            <div className="col-span-2 lg:col-span-4">
              <p className="eyebrow">{t.footer.reachUs}</p>
              <ul className="mt-5 space-y-4 text-[15px] leading-relaxed">
                <li className="flex gap-3">
                  <FooterIcon d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.8C19 14.8 12 21 12 21zm0-8.7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                  <span className="text-sand/80">{church.address}</span>
                </li>
                <li className="flex gap-3">
                  <FooterIcon d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
                  <span className="flex flex-col">
                    {church.phones.map((phone) => (
                      <a key={phone.href} href={phone.href} className="text-sand/80 transition-colors hover:text-gold-light">{phone.label}</a>
                    ))}
                  </span>
                </li>
                <li className="flex gap-3">
                  <FooterIcon d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm0 1.5V7l8 5.5L20 7v-.5" />
                  <a href={`mailto:${church.email}`} className="break-all text-sand/80 transition-colors hover:text-gold-light">{church.email}</a>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-2">
              <FooterColumn title={t.footer.gather} links={footer.gather} t={t} />
            </div>
            <div className="lg:col-span-2">
              <FooterColumn title={t.footer.explore} links={footer.explore} t={t} />
            </div>
            {serviceStrip.length ? (
              <div className="col-span-2 lg:col-span-4">
                <p className="eyebrow">{t.footer.gatherings}</p>
                <ul className="mt-5 space-y-2.5 text-[15px]">
                  {serviceStrip.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sand/80">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[13px] text-muted-dark">{t.footer.times}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pb-24 pt-6 text-[13px] text-muted-dark sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:pb-6">
            <p>© {new Date().getFullYear()} {church.name}. {t.footer.rights}</p>
            <a href={staffLoginUrl} className="text-on-dark/40 transition-colors hover:text-on-dark/70">{t.footer.staffSignIn}</a>
          </div>
        </div>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-flow-col auto-cols-fr border-t border-white/10 bg-forest-950 pb-[env(safe-area-inset-bottom)] text-on-dark min-[900px]:hidden" aria-label="Quick actions">
        {sticky.map((link) => (
          <NavAnchor
            key={link.label}
            link={link}
            className={link.label === 'Give'
              ? 'flex min-h-14 items-center justify-center gap-1.5 bg-gold px-1 text-center text-[13px] font-semibold leading-tight text-ink sm:text-sm'
              : 'flex min-h-14 items-center justify-center gap-1.5 px-1 text-center text-[13px] font-semibold leading-tight sm:text-sm'}
          >
            {link.label === 'Live prayer' ? <LiveDot pulse={liveNow} /> : null} {link.label === 'Live prayer' && liveNow ? t.liveNow : label(t, link.label)}
          </NavAnchor>
        ))}
      </nav>
    </div>
  );
}

function FooterIcon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-gold">
      <path d={d} />
    </svg>
  );
}

/**
 * "Book a baptism, dedication or wedding": pick what you need, then WhatsApp (message ready to send)
 * or call. The contact person's name is a placeholder in lib/church.ts (bookingContact.name).
 */
function BookingBand({ t }: { t: Dict }) {
  const services = t.footer.services;
  const [pick, setPick] = useState(0);
  const contact = church.bookingContact;
  const message = fill(t.footer.bookMessage, { church: church.name, service: services[pick] || services[0] });
  const whatsapp = `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
  const initials = contact.name
    ? contact.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : null;
  return (
    <section aria-labelledby="book-title" className="border-b border-white/10 px-4 py-12 sm:px-6" id="book">
      <div className="mx-auto grid max-w-6xl gap-8 rounded-3xl border border-gold/25 bg-forest-900 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:p-10 min-[900px]:grid-cols-[1.45fr_1fr] min-[900px]:items-center min-[900px]:gap-12">
        <div>
          <p className="eyebrow">{t.footer.bookEyebrow}</p>
          <h2 id="book-title" className="mt-3 font-display text-3xl leading-tight text-on-dark sm:text-4xl">{t.footer.bookTitle}</h2>
          <p className="mt-3 max-w-xl text-muted-dark">{t.footer.bookLead}</p>
          <p className="mt-6 text-sm font-semibold text-sand" id="book-pick">{t.footer.bookPick}</p>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="book-pick">
            {services.map((service, i) => (
              <button
                key={service}
                type="button"
                role="radio"
                aria-checked={pick === i}
                onClick={() => setPick(i)}
                className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${
                  pick === i ? 'border-gold bg-gold text-ink' : 'border-sand/30 text-on-dark hover:border-gold/70'
                }`}
              >
                {service}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <p className="eyebrow">{t.footer.bookContact}</p>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-footer font-display text-lg text-gold-light" aria-hidden="true">
              {initials || '✦'}
            </span>
            <div className="min-w-0">
              {contact.name ? (
                <p className="truncate text-lg font-semibold text-on-dark">{contact.name}</p>
              ) : (
                <p className="text-lg font-semibold italic text-on-dark/70" data-placeholder="booking-contact-name">{t.footer.bookNamePending}</p>
              )}
              <p className="text-sm text-muted-dark">{t.footer.bookRole}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="site-button justify-center whitespace-nowrap bg-gold px-5 text-ink">
              {t.footer.bookWhatsApp}
            </a>
            <a href={contact.phone.href} className="site-button justify-center whitespace-nowrap border border-sand/40 px-5 text-on-dark">
              {t.footer.bookCall} {contact.phone.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FooterColumn({ title, links, t }: { title: string; links: NavLink[]; t: Dict }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-5 space-y-2.5 text-[15px]">
        {links.map((link) => (
          <li key={link.label}>
            <NavAnchor link={link} className="text-sand/80 transition-colors hover:text-gold-light">{label(t, link.label)}</NavAnchor>
          </li>
        ))}
      </ul>
    </div>
  );
}
