import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

export function StatCard({ title, value, icon, trend, trendLabel, className }: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-1.5">
          <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
          <p className="truncate text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {trend !== undefined || trendLabel ? (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
              {trend !== undefined ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-semibold',
                    isPositive ? 'text-success' : 'text-destructive'
                  )}
                >
                  {isPositive ? (
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {Math.abs(trend)}%
                </span>
              ) : null}
              {trendLabel ? <span className="text-muted-foreground">{trendLabel}</span> : null}
            </div>
          ) : null}
        </div>
        {icon ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            {icon}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
