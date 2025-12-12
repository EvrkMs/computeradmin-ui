import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  LinkIcon,
  Unlink,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const TelegramCard = ({ telegram, loading, error, onReload, onBind, onUnbind }) => {
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-28">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (telegram) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-emerald-900/30 rounded-lg border border-green-200 dark:border-emerald-800">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-emerald-300" />
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {telegram.firstName} {telegram.lastName}
                </p>
                {telegram.username && (
                  <p className="text-sm text-gray-600 dark:text-slate-400">@{telegram.username}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onUnbind}
              className="gap-2 dark:border-slate-700 dark:text-slate-100"
            >
              <Unlink className="h-4 w-4" />
              Отвязать
            </Button>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Привязан: {new Date(telegram.boundAt).toLocaleString('ru-RU')}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-900/40 rounded-lg border dark:border-slate-800">
          <XCircle className="h-5 w-5 text-gray-400 dark:text-slate-500" />
          <p className="text-gray-600 dark:text-slate-300">Telegram не привязан</p>
        </div>
        <Button onClick={onBind} className="gap-2">
          <LinkIcon className="h-4 w-4" />
          Привязать Telegram
        </Button>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Telegram
            </CardTitle>
            <CardDescription>Привязка Telegram аккаунта для быстрого входа</CardDescription>
          </div>
          {!loading && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-slate-600 dark:text-slate-300"
              onClick={onReload}
            >
              <Loader2 className="h-4 w-4" />
              Обновить
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
};

export default TelegramCard;
