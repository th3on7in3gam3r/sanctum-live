import { DuplicateSlug } from './errors.ts';

export function ensureSlugAvailable(taken: boolean, slug: string): void {
  if (taken) throw DuplicateSlug(slug);
}
