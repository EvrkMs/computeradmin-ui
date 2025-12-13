import requestMetricsService from './RequestMetricsService';

// Глобальная обертка над fetch, чтобы собирать метрики всех запросов (включая библиотеку OIDC).
// Не меняет сами запросы, уважает флаг __skipGlobalMetrics в init.
export const installGlobalFetchMetrics = () => {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  if (window.__fetchMetricsInstalled) return;

  const originalFetch = window.fetch.bind(window);
  window.__fetchMetricsInstalled = true;

  window.fetch = async (input, init = {}) => {
    if (init.__skipGlobalMetrics) {
      return originalFetch(input, init);
    }

    const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const timestamp = Date.now();
    const method = (init.method || (input?.method ?? 'GET')).toUpperCase();
    const url = typeof input === 'string' ? input : input?.url ?? '';
    const scope = (() => {
      try {
        const parsed = new URL(url, window.location.origin);
        return parsed.host || 'global';
      } catch {
        return 'global';
      }
    })();

    const record = (status, ok, duration, error) => {
      requestMetricsService.addEntry({
        scope,
        url,
        method,
        status,
        ok,
        duration,
        timestamp,
        error,
      });
    };

    try {
      const response = await originalFetch(input, init);
      const duration =
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;
      record(response.status, response.ok, duration);
      return response;
    } catch (err) {
      const duration =
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;
      const status = err?.name === 'AbortError' ? 'ABORT' : 'NETWORK';
      record(status, false, duration, err?.message);
      throw err;
    }
  };
};

export default installGlobalFetchMetrics;
