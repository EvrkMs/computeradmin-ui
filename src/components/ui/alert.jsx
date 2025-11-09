import React from 'react';
import { cn } from '@/lib/utils';

export const Alert = React.forwardRef(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses =
      variant === 'destructive'
        ? 'border-destructive/50 text-destructive'
        : 'border border-border text-foreground';

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
          variantClasses,
          className,
        )}
        {...props}
      />
    );
  },
);

Alert.displayName = 'Alert';

export const AlertDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm leading-relaxed', className)}
      {...props}
    />
  ),
);

AlertDescription.displayName = 'AlertDescription';

export const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-sm font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));

AlertTitle.displayName = 'AlertTitle';
