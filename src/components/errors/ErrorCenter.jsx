import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const ErrorCenter = ({ errors, onDismiss }) => {
  if (!errors.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
      {errors.map((error) => (
        <Alert key={error.id} variant="destructive" className="shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription className="text-sm">
                {error.message}
                {error.meta?.hint && (
                  <span className="block text-xs opacity-80 mt-1">{error.meta.hint}</span>
                )}
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => onDismiss(error.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default ErrorCenter;
