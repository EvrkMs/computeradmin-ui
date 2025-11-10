import { useEffect, useMemo, useState } from 'react';
import performanceMetricsService from '@/services/metrics/PerformanceMetricsService';

const formatMs = (value) => (value ? Math.round(value) : 0);

export const usePerformanceMetrics = () => {
  const [entries, setEntries] = useState(() => performanceMetricsService.getEntries());

  useEffect(() => performanceMetricsService.subscribe(setEntries), []);

  const navigation = useMemo(
    () => entries.filter((entry) => entry.type === 'navigation'),
    [entries],
  );
  const resources = useMemo(
    () => entries.filter((entry) => entry.type === 'resource'),
    [entries],
  );
  const paints = useMemo(
    () => entries.filter((entry) => entry.type === 'paint'),
    [entries],
  );
  const longTasks = useMemo(
    () => entries.filter((entry) => entry.type === 'longtask'),
    [entries],
  );
  const sections = useMemo(
    () => entries.filter((entry) => entry.type === 'section'),
    [entries],
  );

  const summary = useMemo(() => {
    const fcp = paints.find((entry) => entry.name === 'first-contentful-paint');
    const fp = paints.find((entry) => entry.name === 'first-paint');
    const nav = navigation[0];
    const avgResource =
      resources.length > 0
        ? Math.round(resources.reduce((sum, entry) => sum + (entry.duration || 0), 0) / resources.length)
        : 0;
    return {
      firstPaint: fp ? formatMs(fp.duration) : null,
      firstContentfulPaint: fcp ? formatMs(fcp.duration) : null,
      domContentLoaded: nav ? formatMs(nav.domContentLoaded) : null,
      loadEvent: nav ? formatMs(nav.loadEvent) : null,
      ttfb: nav ? formatMs(nav.ttfb) : null,
      avgResource,
      longTaskCount: longTasks.length,
    };
  }, [paints, navigation, resources, longTasks]);

  return {
    entries,
    navigation,
    resources,
    paints,
    longTasks,
    sections,
    summary,
    clearMetrics: () => performanceMetricsService.clear(),
  };
};

export default usePerformanceMetrics;
