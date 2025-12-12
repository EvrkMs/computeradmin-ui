import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Monitor, AlertCircle, Clock, XCircle } from 'lucide-react';

const SessionsCard = ({
  sessions,
  currentSession,
  loading,
  error,
  onReload,
  onRevoke,
  onRevokeAll,
}) => {
  const activeSessions = useMemo(() => sessions.filter((s) => !s.revoked), [sessions]);
  const revokedSessions = useMemo(() => sessions.filter((s) => s.revoked), [sessions]);

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

    return (
      <div className="space-y-3">
        {activeSessions.map((session) => {
          const isCurrent = session.id === currentSession?.id || session.isCurrent;
          return (
            <div
              key={session.id}
              className={`p-4 rounded-lg border transition-colors ${
                isCurrent
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-900/40 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {session.device || 'Неизвестное устройство'}
                    </p>
                    {isCurrent && (
                      <Badge variant="default" className="text-xs dark:bg-blue-500 dark:text-slate-900">
                        Текущая
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">{session.userAgent}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.lastSeenAt ? new Date(session.lastSeenAt).toLocaleString('ru-RU') : '—'}
                    </span>
                    <span>{session.ipAddress || '—'}</span>
                  </div>
                </div>
                {!isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRevoke(session.id)}
                    className="text-slate-600 dark:text-slate-300"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {activeSessions.length === 0 && (
          <div className="flex items-center justify-center h-28 text-sm text-gray-500 dark:text-slate-400">
            Активных сессий нет
          </div>
        )}
        {revokedSessions.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Отозванные сессии</p>
            {revokedSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30"
              >
                <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {session.device || 'Неизвестное устройство'}
                    </span>
                    {session.revokedAt && (
                      <span>Отозвана {new Date(session.revokedAt).toLocaleString('ru-RU')}</span>
                    )}
                  </div>
                  {session.revocationReason && (
                    <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Причина: {session.revocationReason}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {session.ipAddress || '—'} • {session.userAgent || '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Активные сессии
            </CardTitle>
            <CardDescription>Управление устройствами с доступом к вашему аккаунту</CardDescription>
          </div>
          {!loading && activeSessions.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-slate-600 dark:text-slate-300"
                onClick={onReload}
              >
                <Loader2 className="h-4 w-4" />
                Обновить
              </Button>
              <Button variant="destructive" size="sm" onClick={onRevokeAll}>
                Отозвать все
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
};

export default SessionsCard;
