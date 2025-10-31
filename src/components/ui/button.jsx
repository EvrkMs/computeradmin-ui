import React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = {
  default:
    'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-colors',
  ghost: 'hover:bg-muted hover:text-muted-foreground',
  outline:
    'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
};

const sizeVariants = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

export const Button = React.forwardRef(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const variantClasses = buttonVariants[variant] || buttonVariants.default;
    const sizeClasses = sizeVariants[size] || sizeVariants.default;

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50',
          variantClasses,
          sizeClasses,
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
