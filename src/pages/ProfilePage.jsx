import React, { useEffect, useState, useEffectEvent, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Smartphone,
  Clock,
  Monitor,
  AlertCircle,
  CheckCircle2,
  XCircle,
  LinkIcon,
  Unlink,
  Loader2,
} from 'lucide-react';

const ProfilePage = () => {
  const { authService } = useAuth();

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState('');

  const [telegram, setTelegram] = useState(null);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [telegramError, setTelegramError] = useState('');

  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState('');

  const loadUserInfo = useEffectEvent(async () => {
    try {
      setUserLoading(true);
      setUserError('');
      const userInfo = await authService.getUserInfo();
      setUser(userInfo);
    } catch (err) {
      setUserError('Не удалось загрузить данные пользователя');
      console.error('User info load failed:', err);
    } finally {
      setUserLoading(false);
    }
  });

  const loadTelegramInfo = useEffectEvent(async () => {
    try {
      setTelegramLoading(true);
      setTelegramError('');
      const telegramInfo = await authService.getTelegramInfo().catch(() => null);
      setTelegram(telegramInfo);
    } catch (err) {
      setTelegramError('Не удалось загрузить данные Telegram');
      console.error('Telegram info load failed:', err);
    } finally {
      setTelegramLoading(false);
    }
  });

  const loadSessions = useEffectEvent(async () => {
    try {
      setSessionsLoading(true);
      setSessionsError('');
      const [sessionsData, currentSessionData] = await Promise.all([
        authService.getSessions(true),
        authService.getCurrentSession().catch(() => null),
      ]);
      setSessions(sessionsData || []);
      setCurrentSession(currentSessionData);
    } catch (err) {
      setSessionsError('Не удалось загрузить сессии');
      console.error('Sessions load failed:', err);
    } finally {
      setSessionsLoading(false);
    }
  });

  useEffect(() => {
    loadUserInfo();
    loadTelegramInfo();
    loadSessions();
  }, [authService]);

  const handleUnbindTelegram = () => {
    const returnUrl = window.location.href;
    const target = authService.getAuthorizationUrl(
      `/Account/Telegram/Unbind?returnUrl=${encodeURIComponent(returnUrl)}`,
    );
    window.location.href = target;
  };

  const handleRevokeSession = async (id) => {
    try {
      await authService.revokeSession(id);
      setSessions((prev) => prev.filter((session) => session.id !== id));
      if (currentSession?.id === id) {
        setCurrentSession(null);
      }
      await loadSessions();
    } catch (err) {
      setSessionsError('Ошибка отзыва сессии');
    }
  };

  const handleRevokeAll = async () => {
    try {
      await authService.revokeAllSessions();
      setSessions((prev) => prev.filter((session) => session.id === currentSession?.id));
      await loadSessions();
    } catch (err) {
      setSessionsError('Ошибка отзыва сессий');
    }
  };

  const activeSessions = useMemo(() => sessions.filter((s) => !s.revoked), [sessions]);
  const revokedSessions = useMemo(() => sessions.filter((s) => s.revoked), [sessions]);

  const showSkeleton = (loading, error, content) => {
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
    return content;
  };

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Информация о пользователе
            </CardTitle>
            {!userLoading && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-slate-600 dark:text-slate-300"
                onClick={loadUserInfo}
              >
                <Loader2 className="h-4 w-4" />
                Обновить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSkeleton(
            userLoading,
            userError,
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 dark:text-slate-400">Полное имя</Label>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {user?.full_name || user?.name || '—'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-slate-400">Имя пользователя</Label>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {user?.preferred_username || '—'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-slate-400">Email</Label>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {user?.email || '—'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-slate-400">Телефон</Label>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {user?.phone_number || '—'}
                  </p>
                </div>
              </div>
              {user?.roles && user.roles.length > 0 && (
                <div>
                  <Label className="text-gray-500 dark:text-slate-400">Роли</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {user.roles.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>,
          )}
        </CardContent>
      </Card>

      {/* Telegram Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Telegram
              </CardTitle>
              <CardDescription>
                Привязка Telegram аккаунта для быстрого входа
              </CardDescription>
            </div>
            {!telegramLoading && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-slate-600 dark:text-slate-300"
                onClick={loadTelegramInfo}
              >
                <Loader2 className="h-4 w-4" />
                Обновить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showSkeleton(
            telegramLoading,
            telegramError,
            telegram ? (
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
                onClick={handleUnbindTelegram}
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
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-900/40 rounded-lg border dark:border-slate-800">
                  <XCircle className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                  <p className="text-gray-600 dark:text-slate-300">Telegram не привязан</p>
                </div>
                <Button
                  onClick={() => {
                    const currentHref =
                      typeof window !== 'undefined' && window.location
                        ? window.location.href
                        : '/';
                    const target = authService.getAuthorizationUrl(
                      `/Account/Telegram/Bind?returnUrl=${encodeURIComponent(currentHref)}`,
                    );
                    window.location.href = target;
                  }}
                  className="gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  Привязать Telegram
                </Button>
              </div>
            ),
          )}
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Активные сессии
              </CardTitle>
              <CardDescription>
                Управление устройствами с доступом к вашему аккаунту
              </CardDescription>
            </div>
            {!sessionsLoading && sessions.filter((s) => !s.revoked).length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-slate-600 dark:text-slate-300"
                  onClick={loadSessions}
                >
                  <Loader2 className="h-4 w-4" />
                  Обновить
                </Button>
                <Button variant="destructive" size="sm" onClick={handleRevokeAll}>
                  Отозвать все
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showSkeleton(
            sessionsLoading,
            sessionsError,
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
                            {session.lastSeenAt
                              ? new Date(session.lastSeenAt).toLocaleString('ru-RU')
                              : '—'}
                          </span>
                          <span>{session.ipAddress || '—'}</span>
                        </div>
                      </div>
                      {!isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeSession(session.id)}
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
                            <span>
                              Отозвана {new Date(session.revokedAt).toLocaleString('ru-RU')}
                            </span>
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
            </div>,
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
