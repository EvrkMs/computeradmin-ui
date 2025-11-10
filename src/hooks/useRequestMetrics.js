import { useEffect, useState, useMemo } from 'react';
import requestMetricsService from '@/services/metrics/RequestMetricsService';

export const useRequestMetrics = () => {
  const [entries, setEntries] = useState(() => requestMetricsService.getEntries());

  useEffect(() => requestMetricsService.subscribe(setEntries), []);

  const stats = useMemo(() => {
    if (entries.length === 0) {
      return { avg: 0, max: 0 };
    }
    const durations = entries.map((entry) => entry.duration || 0);
    const total = durations.reduce((sum, value) => sum + value, 0);
    const max = Math.max(...durations);
    return {
      avg: Math.round((total / durations.length) || 0),
      max: Math.round(max || 0),
    };
  }, [entries]);

  return {
    entries,
    stats,
    clearMetrics: () => requestMetricsService.clear(),
  };
};

export default useRequestMetrics;
