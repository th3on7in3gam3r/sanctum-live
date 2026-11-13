'use client';

import { useActionState } from 'react';
import { idleFormState, type FormState } from '@/lib/form';
import { DEFAULT_PHONE_COUNTRY, phoneCountries } from '@/lib/phone';
import type { Dict } from '@/lib/i18n';

const PHONE_COUNTRIES = phoneCountries();

export type PublicField = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number;
  max?: number;
  defaultValue?: string;
};

export function PublicForm({
  action,
  fields,
  submitLabel,
  hidden,
  formId = 'form',
  t,
}: {
  t: Dict;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: PublicField[];
  submitLabel: string;
  hidden?: Record<string, string>;
  formId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, idleFormState);

  if (state.status === 'success') {
    return (
      <p className="rounded-3xl bg-forest-900 px-5 py-4 text-on-dark" role="status">
        {state.message || t.form.thanks}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-[26px] bg-white p-6" noValidate>
      {hidden
        ? Object.entries(hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)
        : null}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      {state.message ? (
        <p className="text-sm font-semibold text-red-800" role="alert">
          {state.message}
        </p>
      ) : null}
      {fields.map((field) => {
        const error = state.fieldErrors?.[field.name];
        const id = `${formId}-${field.name}`;
        const shared = {
          id,
          name: field.name,
          required: field.required,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? `${id}-error` : undefined,
          className: 'mt-1 w-full rounded-2xl border border-ink/15 bg-sand px-4 py-3 text-base',
        };
        if (field.type === 'tel') {
          return (
            <div key={field.name} className="block text-sm font-semibold">
              <label htmlFor={id}>{field.label}</label>
              <div className="mt-1 flex gap-2">
                <select
                  name={`${field.name}Country`}
                  aria-label={`${field.label} ${t.form.country}`}
                  defaultValue={DEFAULT_PHONE_COUNTRY}
                  className="w-[8.5rem] shrink-0 rounded-2xl border border-ink/15 bg-sand px-3 py-3 text-base"
                >
                  <optgroup label={t.form.common}>
                    {PHONE_COUNTRIES.preferred.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.dial})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={t.form.allCountries}>
                    {PHONE_COUNTRIES.others.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.dial})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <input
                  {...shared}
                  className="min-w-0 flex-1 rounded-2xl border border-ink/15 bg-sand px-4 py-3 text-base"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0772 000000"
                  defaultValue={field.defaultValue}
                />
              </div>
              {error ? (
                <span id={`${id}-error`} className="mt-1 block font-normal text-red-800">
                  {error}
                </span>
              ) : (
                <span className="mt-1 block text-xs font-normal text-ink/55">
                  {t.form.phoneHint}
                </span>
              )}
            </div>
          );
        }
        return (
          <label key={field.name} className="block text-sm font-semibold" htmlFor={id}>
            {field.label}
            {field.type === 'textarea' ? <textarea {...shared} rows={4} /> : field.type === 'select' ? (
              <select {...shared} defaultValue={field.defaultValue || ''}>
                <option value="">{t.visit.chooseService}</option>
                {(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : (
              <input
                {...shared}
                type={field.type || 'text'}
                inputMode={undefined}
                min={field.min}
                max={field.max}
                defaultValue={field.defaultValue}
              />
            )}
            {error ? (
              <span id={`${id}-error`} className="mt-1 block font-normal text-red-800">
                {error}
              </span>
            ) : null}
          </label>
        );
      })}
      <button
        type="submit"
        disabled={pending}
        className="site-button bg-gold text-ink disabled:opacity-60"
      >
        {pending ? t.form.sending : submitLabel}
      </button>
    </form>
  );
}
