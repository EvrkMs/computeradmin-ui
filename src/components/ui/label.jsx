import React from 'react';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef(
  ({ className, children, htmlFor, ...props }, ref) => (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={cn(
        'text-sm font-medium leading-6 text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    >
      {children}
    </label>
  ),
);

Label.displayName = 'Label';
