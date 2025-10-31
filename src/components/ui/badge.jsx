import React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-border text-foreground',
};

export const Badge = ({ className, variant = 'default', ...props }) => {
  const variantClasses = badgeVariants[variant] || badgeVariants.default;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantClasses,
        className,
      )}
      {...props}
    />
  );
};
