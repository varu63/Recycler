import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  image?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, image, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-4 py-12 text-center',
        className
      )}
    >
      {image ? (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="mb-3 h-44 w-auto max-w-full object-contain sm:h-56"
        />
      ) : null}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">{action}</div>
      ) : null}
    </div>
  );
}
