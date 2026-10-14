import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export type TimelineStatus = 'completed' | 'current' | 'upcoming' | 'error';

export interface TimelineItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  timestamp?: ReactNode;
  status: TimelineStatus;
  icon?: ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusClasses: Record<TimelineStatus, string> = {
  completed: 'border-success bg-success text-success-foreground',
  current: 'border-primary bg-background text-primary ring-4 ring-primary/10',
  upcoming: 'border-border bg-muted text-muted-foreground',
  error: 'border-destructive bg-destructive text-destructive-foreground',
};

function defaultIcon(status: TimelineStatus): ReactNode {
  if (status === 'completed') return <Check className="h-4 w-4" aria-hidden="true" />;
  if (status === 'error') return <X className="h-4 w-4" aria-hidden="true" />;
  return <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('relative space-y-6', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <li key={item.id} className="relative flex gap-4">
            {!isLast ? (
              <span
                aria-hidden="true"
                className="absolute left-4 top-8 -bottom-6 w-px -translate-x-1/2 bg-border"
              />
            ) : null}
            <span
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                statusClasses[item.status]
              )}
            >
              {item.icon ?? defaultIcon(item.status)}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                {item.timestamp ? (
                  <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                ) : null}
              </div>
              {item.description ? (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
