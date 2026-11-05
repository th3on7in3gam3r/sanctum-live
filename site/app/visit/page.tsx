import type { Metadata } from 'next';
import { FindUs } from '@/components/page/FindUs';
import { PageHero } from '@/components/page/PageHero';
import { PublicForm } from '@/components/PublicForm';
import { submitVisitor } from '@/lib/actions';
import { getPage, listFaqs, listServiceTimes } from '@/lib/api';
import { clock, homeStrip } from '@/lib/schedule';
import { church } from '@/lib/church';
import { parseHome } from '@/lib/home';

export const metadata: Metadata = {
  title: 'Plan a visit',
  description: 'Tell Promised Land Christian Center you are planning to visit.',
};

export default async function VisitPage() {
  const [home, faqs, serviceTimes] = await Promise.all([getPage('home'), listFaqs(), listServiceTimes()]);
  const parsed = home ? parseHome(home) : null;
  const times = serviceTimes.length
    ? serviceTimes.map((time) => ({ day: time.weekday || time.cadence, time: clock(time), name: time.name, line: time.place || time.note || '' }))
    : parsed?.times || [];
  const points = parsed?.visit || [];

  return (
    <>
      <PageHero
        variant="split"
        eyebrow="Visit"
        title="We've saved you a"
        accent="seat."
        lede={(serviceTimes.length ? homeStrip(serviceTimes) : times.map((item) => item.name)).join(' · ') || church.address}
        photo={home?.heroImageUrl || '/visit-welcome.jpg'}
      >
        <p className="mt-4 text-sand">{church.address}</p>
      </PageHero>
      <section className="bg-cream px-4 py-20 text-ink sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <p className="eyebrow">First Sunday</p>
            <h2 className="font-display mt-3 text-[clamp(40px,5vw,56px)] font-light leading-none tracking-[-0.02em]">
              What to expect
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/70">
              A few simple things so your first visit feels easy and clear.
            </p>
          </div>
          <ol className="mt-12 grid border-t border-ink/15 min-[760px]:grid-cols-2">
            {points.map((point, index) => (
              <li
                key={point}
                className="flex gap-5 border-b border-ink/15 py-6 min-[760px]:odd:border-r min-[760px]:odd:pr-10 min-[760px]:even:pl-10"
              >
                <span className="font-display shrink-0 pt-0.5 text-lg tabular-nums tracking-wide text-gold">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-[17px] leading-snug text-ink">{point.replace(/\.$/, '')}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="bg-sand px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 min-[900px]:grid-cols-2">
          <PublicForm
            action={submitVisitor}
            fields={[
              { name: 'name', label: 'Name', required: true },
              { name: 'phone', label: 'Phone', type: 'tel', required: true },
              { name: 'email', label: 'Email (optional)', type: 'email' },
              {
                name: 'service',
                label: 'Which service',
                type: 'select',
                options: times.map((item) => ({ value: `${item.name} ${item.time}`, label: `${item.name} · ${item.time}` })),
              },
              { name: 'message', label: 'Anything we should know', type: 'textarea' },
            ]}
            submitLabel="Save my seat"
            hidden={{ source: 'PLAN_A_VISIT' }}
            formId="visit"
          />
          <FindUs />
        </div>
      </section>
      {faqs.length ? (
        <section className="bg-cream px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-5xl font-light text-ink">Questions</h2>
            <div className="mt-6 divide-y divide-ink/15 border-y border-ink/15">
              {faqs.map((faq) => (
                <details key={faq.id} className="py-4">
                  <summary className="cursor-pointer font-display text-2xl">{faq.question}</summary>
                  <p className="mt-3 leading-relaxed text-ink/80">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
