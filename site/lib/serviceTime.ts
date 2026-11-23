import { z } from 'zod';

export const publicServiceTimeSchema = z.object({
  id: z.string(),
  name: z.string(),
  homeLabel: z.string().nullable(),
  cadence: z.string(),
  weekday: z.string().nullable(),
  opens: z.string(),
  closes: z.string(),
  startLabel: z.string(),
  endLabel: z.string(),
  place: z.string().nullable(),
  note: z.string().nullable(),
  showOnHome: z.boolean(),
  sortOrder: z.number(),
});

export type PublicServiceTime = z.infer<typeof publicServiceTimeSchema>;
export type ServiceTime = { day: string; time: string; name: string; line: string };
