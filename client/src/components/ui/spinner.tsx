import { LoaderCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return <LoaderCircle aria-hidden="true" className={cn('h-4 w-4 animate-spin', className)} />;
}
