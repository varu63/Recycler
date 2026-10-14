import { MAX_PAGE_SIZE, PAGE_SIZE } from '../../../shared/src/constants.js';
import type { Paginated, PaginationMeta } from '../../../shared/src/types.js';

export interface PageParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPagination(
  query: { page?: unknown; limit?: unknown } = {},
  fallbackLimit = PAGE_SIZE
): PageParams {
  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1
    ? Math.min(Math.floor(rawLimit), MAX_PAGE_SIZE)
    : fallbackLimit;
  return { page, limit, skip: (page - 1) * limit };
}

export function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  return { page, limit, total, totalPages: limit > 0 ? Math.ceil(total / limit) || 0 : 0 };
}

export function buildPaginated<T>(items: T[], total: number, page: number, limit: number): Paginated<T> {
  return { items, meta: buildMeta(total, page, limit) };
}

export type SortDirection = 1 | -1;

export function parseSort(
  sort: string | undefined,
  allowed: Record<string, string>,
  fallback: Record<string, SortDirection>
): Record<string, SortDirection> {
  if (!sort) return fallback;
  let key = sort;
  let direction: 'asc' | 'desc' = 'asc';
  if (sort.startsWith('-')) {
    key = sort.slice(1);
    direction = 'desc';
  } else if (sort.includes(':')) {
    const [k, d] = sort.split(':');
    key = k;
    direction = d === 'desc' ? 'desc' : 'asc';
  }
  const field = allowed[key];
  if (!field) return fallback;
  return { [field]: direction === 'desc' ? -1 : 1 } as Record<string, SortDirection>;
}
