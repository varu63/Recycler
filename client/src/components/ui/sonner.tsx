import * as React from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      richColors
      position="top-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast rounded-lg border border-border bg-card text-card-foreground shadow-card font-sans',
          title: 'text-sm font-semibold text-foreground',
          description: 'text-sm text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground rounded-md px-2 py-1 text-xs',
          cancelButton: 'bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs',
          closeButton: 'text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
