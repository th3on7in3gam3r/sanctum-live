import type { Metadata } from 'next';
import { FindUs } from '@/components/page/FindUs';
import { PageHero } from '@/components/page/PageHero';
import { PublicForm } from '@/components/PublicForm';
import { submitVisitor } from '@/lib/actions';
import { getDictionary } from '@/lib/locale';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Promised Land Christian Center or send a prayer request.',
};

export default async function ContactPage() {
  const { t } = await getDictionary();
  const fields = [
    { name: 'name', label: t.form.name, required: true },
    { name: 'phone', label: t.form.phone, type: 'tel' as const, required: true },
    { name: 'email', label: t.form.email, type: 'email' as const },
    { name: 'message', label: t.form.message, type: 'textarea' as const },
  ];
  return (
    <>
      <PageHero eyebrow={t.contact.eyebrow} title={t.contact.title} lede={t.contact.lede} variant="centered" />
      <section className="bg-sand px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 min-[900px]:grid-cols-2">
          <div className="space-y-10">
            <PublicForm action={submitVisitor} fields={fields} t={t} submitLabel={t.contact.send} hidden={{ source: 'CONTACT' }} formId="contact" />
            <div>
              <h2 className="font-display mb-4 text-4xl font-normal text-ink">{t.contact.prayer}</h2>
              <PublicForm
                action={submitVisitor}
                fields={fields.map((field) => field.name === 'message' ? { ...field, label: t.contact.prayer } : field)}
                formId="prayer"
                t={t}
                submitLabel={t.contact.sendPrayer}
                hidden={{ source: 'PRAYER' }}
              />
            </div>
          </div>
          <FindUs t={t} />
        </div>
      </section>
    </>
  );
}
