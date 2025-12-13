import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PiggyBank, RefreshCcw, Plus, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import CreateChangeDialog from './components/CreateChangeDialog';
import ReverseChangeDialog from './components/ReverseChangeDialog';

const STATUS_OPTIONS = [
  { value: '', label: 'Все' },
  { value: 'Posted', label: 'Проведённые' },
  { value: 'Pending', label: 'В ожидании' },
  { value: 'Reversed', label: 'Отменённые' },
];

const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (_) {
    return amount.toFixed(2);
  }
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ru-RU');
  } catch {
    return value;
  }
};

const SafePage = ({ canManageSafe }) => {
  const { authService } = useAuth();
  const [balance, setBalance] = useState(null);
  const [changes, setChanges] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [reverseTarget, setReverseTarget] = useState(null);

  const safeManagerTooltip = canManageSafe
    ? undefined
    : 'Недостаточно прав: требуется роль SafeManager или Root';

  const filters = useMemo(
    () => ({
      page,
      pageSize,
      status,
      from: toIsoOrNull(from),
      to: toIsoOrNull(to),
    }),
    [page, pageSize, status, from, to],
  );

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [balanceData, changesData] = await Promise.allSettled([
        authService.getSafeBalance(),
        authService.getSafeChanges(filters),
      ]);

      if (balanceData.status === 'fulfilled') {
        setBalance(balanceData.value?.balance ?? 0);
      }
      if (changesData.status === 'fulfilled') {
        setChanges(changesData.value?.items ?? []);
        setTotal(changesData.value?.total ?? 0);
      }

      if (balanceData.status === 'rejected' || changesData.status === 'rejected') {
        const err = balanceData.reason ?? changesData.reason;
        if (err?.code === 'NETWORK_ERROR') {
          setError('Сервер аутентификации недоступен. Повторите попытку позже.');
        } else {
          setError(err?.message || 'Не удалось загрузить данные сейфа');
        }
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Failed to load safe data', err);
      if (err?.code === 'NETWORK_ERROR') {
        setError('Сервер аутентификации недоступен. Повторите попытку позже.');
      } else {
        setError(err.message || 'Не удалось загрузить данные сейфа');
      }
      setChanges([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authService, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateChange = useCallback(
    async (payload) => {
      if (!canManageSafe) return;
      try {
        await authService.createSafeChange(payload);
        setShowCreateDialog(false);
        setError('');
        await loadData();
      } catch (err) {
        setError(
          err?.code === 'NETWORK_ERROR'
            ? 'Сервер аутентификации недоступен. Операция не выполнена.'
            : err.message || 'Не удалось создать операцию',
        );
        throw err;
      }
    },
    [authService, canManageSafe, loadData],
  );

  const handleReverseChange = useCallback(
    async (comment) => {
      if (!reverseTarget || !canManageSafe) return;
      try {
        await authService.reverseSafeChange(reverseTarget.id, comment);
        setReverseTarget(null);
        setError('');
        await loadData();
      } catch (err) {
        setError(
          err?.code === 'NETWORK_ERROR'
            ? 'Сервер аутентификации недоступен. Не удалось выполнить реверс.'
            : err.message || 'Не удалось выполнить реверс операции',
        );
        throw err;
      }
    },
    [authService, reverseTarget, canManageSafe, loadData],
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handleFromChange = (value) => {
    setFrom(value);
    setPage(1);
  };

  const handleToChange = (value) => {
    setTo(value);
    setPage(1);
  };

  const renderAmount = (change) => {
    const sign = change.direction === 'Debit' ? '-' : '+';
    const amount = formatCurrency(change.amount);
    return `${sign} ${amount}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Загрузка данных сейфа...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            <CardTitle>Баланс сейфа</CardTitle>
          </div>
          <Button variant="ghost" onClick={loadData} className="gap-2" disabled={refreshing}>
            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(balance ?? 0)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Операции</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="gap-2"
                disabled={!canManageSafe}
                title={safeManagerTooltip}
              >
                <Plus className="h-4 w-4" />
                Новая операция
              </Button>
              <Button
                variant="ghost"
                className="gap-2"
                onClick={loadData}
                disabled={refreshing}
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 dark:text-slate-400">Статус</label>
              <select
                className="px-3 py-2 border rounded-md bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-100"
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 dark:text-slate-400">С даты</label>
              <Input type="datetime-local" value={from} onChange={(e) => handleFromChange(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 dark:text-slate-400">По дату</label>
              <Input type="datetime-local" value={to} onChange={(e) => handleToChange(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={() => {
                setStatus('');
                setFrom('');
                setTo('');
                setPage(1);
              }}>
                Сбросить фильтры
              </Button>
            </div>
          </div>
          {refreshing && (
            <span className="text-sm text-gray-500 dark:text-slate-400">
              Обновление данных...
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="border dark:border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-900/60">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                    Дата
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                    Сумма
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                    Категория
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                    Причина
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                    Комментарий
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                {changes.map((change) => {
                  const canReverse =
                    canManageSafe &&
                    change.status === 'Posted' &&
                    !change.reversalOfChangeId;

                  return (
                    <tr key={change.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-300">{change.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-300">
                        <div className="flex flex-col">
                          <span>{formatDateTime(change.occurredAt)}</span>
                          <span className="text-xs text-gray-500 dark:text-slate-500">
                            Создано: {formatDateTime(change.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-semibold ${
                          change.direction === 'Debit' ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {renderAmount(change)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-300">
                        {change.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-300">
                        {change.reason}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-300 max-w-xs break-words">
                        {change.comment || '—'}
                        {change.reversalComment && (
                          <div className="text-xs text-gray-500 dark:text-slate-500">
                            Отмена: {change.reversalComment}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={change.status === 'Posted' ? 'default' : 'secondary'}
                            className={
                              change.status === 'Posted'
                                ? 'bg-green-500 text-slate-900'
                                : change.status === 'Reversed'
                                  ? 'bg-gray-300 text-slate-900 dark:bg-slate-800 dark:text-slate-200'
                                  : 'bg-yellow-200 text-slate-900 dark:bg-yellow-800 dark:text-yellow-100'
                            }
                          >
                            {change.status}
                          </Badge>
                          {change.reversalOfChangeId && (
                            <Badge variant="outline" className="text-xs dark:border-slate-700">
                              Связан c #{change.reversalOfChangeId}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-slate-600 dark:text-slate-300"
                          onClick={() => {
                            if (canReverse) {
                              setReverseTarget(change);
                            }
                          }}
                          disabled={!canReverse}
                          title={canReverse ? undefined : safeManagerTooltip}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Реверс
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {changes.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-sm text-gray-500 dark:text-slate-400"
                    >
                      Операции не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500 dark:text-slate-400">
                Страница {page} из {totalPages} (всего записей: {total})
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                >
                  Вперёд
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateChangeDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateChange}
      />
      <ReverseChangeDialog
        open={Boolean(reverseTarget)}
        change={reverseTarget}
        onClose={() => setReverseTarget(null)}
        onSubmit={handleReverseChange}
      />
    </div>
  );
};

export default SafePage;
