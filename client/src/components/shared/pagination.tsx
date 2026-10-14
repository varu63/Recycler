import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  className?: string;
}

type PageToken = number | 'left-ellipsis' | 'right-ellipsis';

function getPageTokens(page: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const tokens: PageToken[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) tokens.push('left-ellipsis');
  for (let current = start; current <= end; current += 1) tokens.push(current);
  if (end < totalPages - 1) tokens.push('right-ellipsis');

  tokens.push(totalPages);
  return tokens;
}

export function Pagination({ meta, onPageChange, showInfo = true, className }: PaginationProps) {
  const { page, limit, total, totalPages } = meta;
  const safeTotalPages = Math.max(totalPages, 1);
  const current = Math.min(Math.max(page, 1), safeTotalPages);
  const canGoBack = current > 1;
  const canGoForward = current < safeTotalPages;
  const tokens = getPageTokens(current, safeTotalPages);

  const from = total === 0 ? 0 : (current - 1) * limit + 1;
  const to = Math.min(current * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-col items-center gap-3 sm:flex-row sm:justify-between', className)}
    >
      {showInfo ? (
        <p className="order-2 text-xs text-muted-foreground sm:order-1">
          {total === 0 ? 'No results' : `${from}–${to} of ${total}`}
        </p>
      ) : (
        <span className="hidden sm:block" />
      )}

      <div className="order-1 flex items-center gap-1 sm:order-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoBack}
          aria-label="Previous page"
          onClick={() => onPageChange(current - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {tokens.map((token, index) =>
            typeof token === 'number' ? (
              <Button
                key={`page-${token}`}
                type="button"
                variant={token === current ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                aria-label={`Page ${token}`}
                aria-current={token === current ? 'page' : undefined}
                onClick={() => onPageChange(token)}
              >
                {token}
              </Button>
            ) : (
              <span
                key={`${token}-${index}`}
                className="px-1.5 text-sm text-muted-foreground"
                aria-hidden="true"
              >
                …
              </span>
            )
          )}
        </div>

        <span className="px-2 text-xs text-muted-foreground sm:hidden">
          {current} / {safeTotalPages}
        </span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoForward}
          aria-label="Next page"
          onClick={() => onPageChange(current + 1)}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
