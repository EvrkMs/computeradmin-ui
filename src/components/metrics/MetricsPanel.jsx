import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useRequestMetrics from '@/hooks/useRequestMetrics';
import usePerformanceMetrics from '@/hooks/usePerformanceMetrics';

const formatDuration = (ms) => {
  if (ms === null || ms === undefined) return '—';
  return `${ms?.toFixed ? ms.toFixed(0) : Math.round(ms || 0)} мс`;
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

const statusVariant = (status, ok) => {
  if (status === 'NETWORK') return 'destructive';
  if (!ok) return 'secondary';
  return 'default';
};

const MetricsPanel = ({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState('api');
  const { entries, stats, clearMetrics } = useRequestMetrics();
  const performanceMetrics = usePerformanceMetrics();

  const apiContent = (
    <>
      <div className="flex flex-wrap gap-4 text-sm mb-4">
        <div className="px-3 py-2 rounded border border-slate-200 dark:border-slate-700">
          Среднее время ответа: <strong>{formatDuration(stats.avg)}</strong>
        </div>
        <div className="px-3 py-2 rounded border border-slate-200 dark:border-slate-700">
          Макс. время ответа: <strong>{formatDuration(stats.max)}</strong>
        </div>
        <div className="px-3 py-2 rounded border border-slate-200 dark:border-slate-700">
          Всего записей: <strong>{entries.length}</strong>
        </div>
      </div>

      <div className="border rounded-lg max-h-96 overflow-auto text-sm">
        <table className="w-full">
          <thead className="bg-slate-100 dark:bg-slate-900/50 text-left text-xs uppercase sticky top-0">
            <tr>
              <th className="px-3 py-2">Время</th>
              <th className="px-3 py-2">Источник</th>
              <th className="px-3 py-2">Метод</th>
              <th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2">Длительность</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                  Еще нет данных. Выполните запросы внутри приложения.
                </td>
              </tr>
            ) : (
              entries
                .slice()
                .reverse()
                .map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-3 py-2 whitespace-nowrap">{formatTimestamp(entry.timestamp)}</td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary">{entry.scope}</Badge>
                    </td>
                    <td className="px-3 py-2">{entry.method}</td>
                    <td className="px-3 py-2 max-w-xs truncate" title={entry.url}>
                      {entry.url}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={statusVariant(entry.status, entry.ok)}>
                        {entry.status}
                      </Badge>
                      {entry.error && (
                        <span className="block text-xs text-red-500 mt-1">{entry.error}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{formatDuration(entry.duration)}</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <DialogFooter className="mt-4">
        <Button variant="secondary" onClick={clearMetrics} disabled={!entries.length}>
          Очистить
        </Button>
        <Button onClick={() => onOpenChange?.(false)}>Закрыть</Button>
      </DialogFooter>
    </>
  );

  const perf = performanceMetrics.summary;

  const perfContent = (
    <>
      <div className="flex flex-wrap gap-4 text-sm mb-4">
        <div className="px-3 py-2 rounded border border-slate-200 dark:border-slate-700">
          FCP: <strong>{formatDuration(perf.firstContentfulPaint)}</strong>
        </div>
        <div className="px-3 py-2 rounded border border-slate-200 dark:border-slate-700">
          DOMContentLoaded: <strong>{formatDuration(perf.domContentLoaded)}</strong>
        </div>
        <div className="px-3 py-2 rounded border border-slate-200 dark:border-slate-700">
          TTFB: <strong>{formatDuration(perf.ttfb)}</strong>
        </div>
        <div className="px-3 py-2 rounded border border-slate-200 dark:border-slate-700">
          Среднее время загрузки ресурсов: <strong>{formatDuration(perf.avgResource)}</strong>
        </div>
        <div className="px-3 py-2 rounded border border-slate-200 dark:border-slate-700">
          Длинные задачи: <strong>{perf.longTaskCount}</strong>
        </div>
      </div>

      <div className="space-y-6 text-sm">
        <div className="border rounded-lg overflow-hidden">
          <div className="px-3 py-2 font-semibold bg-slate-100 dark:bg-slate-900/40">
            Ресурсы (чанки, стили)
          </div>
          <div className="max-h-60 overflow-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-left text-xs uppercase sticky top-0">
                <tr>
                  <th className="px-3 py-2">Имя</th>
                  <th className="px-3 py-2">Тип</th>
                  <th className="px-3 py-2">Длительность</th>
                  <th className="px-3 py-2">Размер</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {performanceMetrics.resources.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-5 text-center text-slate-500">
                      Нет данных по ресурсам
                    </td>
                  </tr>
                ) : (
                  performanceMetrics.resources
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-3 py-2 max-w-xs truncate" title={entry.name}>
                          {entry.name}
                        </td>
                        <td className="px-3 py-2">{entry.initiatorType}</td>
                        <td className="px-3 py-2">{formatDuration(entry.duration)}</td>
                        <td className="px-3 py-2">
                          {formatBytes(entry.transferSize || entry.encodedBodySize)}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="px-3 py-2 font-semibold bg-slate-100 dark:bg-slate-900/40">
            Секции интерфейса
          </div>
          <div className="max-h-40 overflow-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-left text-xs uppercase sticky top-0">
                <tr>
                  <th className="px-3 py-2">Секция</th>
                  <th className="px-3 py-2">Длительность</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {performanceMetrics.sections.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-3 py-5 text-center text-slate-500">
                      Данные появятся после переключения между вкладками приложения
                    </td>
                  </tr>
                ) : (
                  performanceMetrics.sections
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-3 py-2 capitalize">{entry.name}</td>
                        <td className="px-3 py-2">{formatDuration(entry.duration)}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {performanceMetrics.longTasks.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="px-3 py-2 font-semibold bg-slate-100 dark:bg-slate-900/40">
              Длинные задачи JavaScript
            </div>
            <div className="max-h-40 overflow-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/40 text-left text-xs uppercase sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Начало</th>
                    <th className="px-3 py-2">Длительность</th>
                    <th className="px-3 py-2">Источник</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {performanceMetrics.longTasks
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-3 py-2">{formatDuration(entry.startTime)}</td>
                        <td className="px-3 py-2">{formatDuration(entry.duration)}</td>
                        <td className="px-3 py-2">
                          {entry.attribution?.length ? entry.attribution.join(', ') : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="mt-4">
        <Button
          variant="secondary"
          onClick={performanceMetrics.clearMetrics}
          disabled={!performanceMetrics.entries.length}
        >
          Очистить
        </Button>
        <Button onClick={() => onOpenChange?.(false)}>Закрыть</Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>Диагностика</DialogTitle>
          <DialogDescription>
            Метрики собираются в браузере и не отправляются на сервер.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'api' ? 'default' : 'outline'}
            onClick={() => setActiveTab('api')}
          >
            API
          </Button>
          <Button
            variant={activeTab === 'performance' ? 'default' : 'outline'}
            onClick={() => setActiveTab('performance')}
          >
            Производительность
          </Button>
        </div>

        {activeTab === 'api' ? apiContent : perfContent}
      </DialogContent>
    </Dialog>
  );
};

export default MetricsPanel;
