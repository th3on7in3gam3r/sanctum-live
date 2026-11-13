'use server';

import { eventRsvpSchema, visitorCardSchema } from '@shared/validations/cms.ts';
import { idleFormState, postPublic, type FormState } from './form';
import { normalizePhone } from './phone';
import { getDictionary } from './locale';

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? '');
}

export async function submitVisitor(_prev: FormState = idleFormState, formData: FormData): Promise<FormState> {
  if (text(formData, 'company').trim()) return { status: 'success' };

  const { t } = await getDictionary();
  const phone = normalizePhone(text(formData, 'phone'), text(formData, 'phoneCountry'));
  const phoneError = phone.ok ? null : text(formData, 'phone').trim() ? t.form.phoneInvalid : t.form.phoneRequired;
  const parsed = visitorCardSchema.safeParse({
    name: text(formData, 'name'),
    phone: phone.ok ? phone.e164 : text(formData, 'phone'),
    email: text(formData, 'email'),
    message: text(formData, 'message'),
    service: text(formData, 'service'),
    source: text(formData, 'source'),
    company: '',
  });

  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path.length ? String(issue.path[0]) : 'form';
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
  }
  if (phoneError) fieldErrors.phone = phoneError;
  if (Object.keys(fieldErrors).length) {
    return { status: 'error', message: t.form.review, fieldErrors };
  }
  if (!parsed.success) return { status: 'error', message: t.form.review };

  const result = await postPublic('/visitor-cards', parsed.data);
  if (result.status === 'success') {
    return { status: 'success', message: t.form.visitorThanks };
  }
  return result;
}

export async function submitRsvp(_prev: FormState = idleFormState, formData: FormData): Promise<FormState> {
  if (text(formData, 'company').trim()) return { status: 'success', message: 'Thank you. You are on the list.' };

  const { t } = await getDictionary();
  const phone = normalizePhone(text(formData, 'phone'), text(formData, 'phoneCountry'));
  const phoneError = phone.ok ? null : text(formData, 'phone').trim() ? t.form.phoneInvalid : t.form.phoneRequired;
  const count = Number(text(formData, 'count') || '1');
  const parsed = eventRsvpSchema.safeParse({
    name: text(formData, 'name'),
    phone: phone.ok ? phone.e164 : text(formData, 'phone'),
    count,
    company: '',
  });
  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path.length ? String(issue.path[0]) : 'form';
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
  }
  if (phoneError) fieldErrors.phone = phoneError;
  if (Object.keys(fieldErrors).length) {
    return { status: 'error', message: t.form.review, fieldErrors };
  }
  if (!parsed.success) return { status: 'error', message: t.form.review };

  const eventId = text(formData, 'eventId');
  const result = await postPublic(`/events/${encodeURIComponent(eventId)}/rsvp`, parsed.data);
  if (result.status === 'success') {
    return { status: 'success', message: t.form.rsvpThanks };
  }
  return result;
}
