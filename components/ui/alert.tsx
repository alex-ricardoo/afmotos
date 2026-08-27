import * as React from 'react';

import { cn } from '@/lib/utils';

function Alert({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        'relative grid w-full gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 text-sm text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-title" className={cn('font-semibold', className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-description" className={cn('text-sm opacity-90', className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
