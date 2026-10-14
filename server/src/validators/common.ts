import { z } from 'zod';
import { MAX_PAGE_SIZE, PAGE_SIZE } from '../../../shared/src/constants.js';

export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id format');

export const idParamsSchema = z.object({ id: objectIdSchema });

export const boolish = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(PAGE_SIZE),
  sort: z.string().max(60).optional(),
  q: z.string().trim().max(200).optional(),
});

export function createListQuery<T extends z.ZodRawShape>(extra: T) {
  return paginationSchema.extend(extra);
}

export const dateInput = z.coerce.date({
  errorMap: () => ({ message: 'Must be a valid date' }),
});
