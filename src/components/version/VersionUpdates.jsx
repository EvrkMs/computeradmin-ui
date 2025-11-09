import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const VersionUpdates = ({ updateAvailable, latestVersion, onReload, checking }) => {
  if (!updateAvailable) return null;

  return (
    <Alert className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 transition-colors">
      <AlertDescription className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-blue-900 dark:text-blue-100">
        <span className="text-sm sm:text-base">
          Произошло обновление интерфейса. Сбросить кеш и загрузить новую версию?
          {latestVersion?.version && (
            <span className="ml-1 text-sm text-blue-700 dark:text-blue-200">
              (доступна {latestVersion.version})
            </span>
          )}
        </span>
        <Button size="sm" onClick={onReload} disabled={checking} className="gap-2">
          {checking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Обновить
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default VersionUpdates;
