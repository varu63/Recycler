import type { ReactNode } from 'react';

import { ASSETS } from '@/assets';
import { cn } from '@/lib/utils';

export interface LogoProps {
  variant?: 'light' | 'dark';
  showWordmark?: boolean;
  className?: string;
  markClassName?: string;
  tagline?: ReactNode;
}

export function MetalMundiIcon({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <img src={ASSETS.logo} alt="MetalMundi" className={cn('shrink-0', className)} />
  );
}

export function Logo({
  variant = 'light',
  showWordmark = true,
  className,
  markClassName,
  tagline,
}: LogoProps) {
  const isDark = variant === 'dark';

  return (
    <span
      className={cn('inline-flex items-center gap-2.5', className)}
      role={showWordmark ? undefined : 'img'}
      aria-label={showWordmark ? undefined : 'MetalMundi'}
    >
      <img
        src={isDark ? ASSETS.logoDark : ASSETS.logo}
        alt="MetalMundi"
        className={cn('h-8 w-8 shrink-0', markClassName)}
      />
      {showWordmark ? (
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              'truncate text-lg font-bold leading-tight tracking-tight',
              isDark ? 'text-white' : 'text-slate-900'
            )}
          >
            MetalMundi
          </span>
          {tagline ? (
            <span
              className={cn(
                'truncate text-[11px] font-medium tracking-wide',
                isDark ? 'text-slate-300' : 'text-slate-500'
              )}
            >
              {tagline}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

Logo.displayName = 'Logo';
