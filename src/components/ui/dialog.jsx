import React, { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

const DialogContext = createContext({ open: false, onOpenChange: undefined });

export const Dialog = ({ open, onOpenChange, children }) => (
  <DialogContext.Provider value={{ open, onOpenChange }}>
    {open ? children : null}
  </DialogContext.Provider>
);

Dialog.displayName = 'Dialog';

const useDialog = () => useContext(DialogContext);

export const DialogContent = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = useDialog();
    if (!open) return null;

    const handleClose = () => {
      if (onOpenChange) {
        onOpenChange(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/40"
          aria-hidden="true"
          onClick={handleClose}
        />
        <div
          ref={ref}
          className={cn(
            'relative z-50 w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg',
            className,
          )}
          role="dialog"
          {...props}
        >
          {children}
        </div>
      </div>
    );
  },
);

DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
);

DialogHeader.displayName = 'DialogHeader';

export const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
      className,
    )}
    {...props}
  />
);

DialogFooter.displayName = 'DialogFooter';

export const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));

DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  ),
);

DialogDescription.displayName = 'DialogDescription';
