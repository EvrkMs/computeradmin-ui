const MAX_ENTRIES = 400;
const RESOURCE_PATTERNS = [/\/assets\/.+\.(js|css)/i];

const nowTimestamp = () => Date.now();

const normalizeName = (name) => {
  if (!name) return '';
  try {
    const url = new URL(name, window.location.origin);
    return url.pathname + url.search;
  } catch {
    return name;
  }
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

class PerformanceMetricsService {
  constructor() {
    this.entries = [];
    this.subscribers = new Set();
    this.isBrowser = typeof window !== 'undefined' && typeof window.performance !== 'undefined';
    if (this.isBrowser) {
      this.initObservers();
    }
  }

  initObservers() {
    if (typeof window.PerformanceObserver === 'undefined') {
      return;
    }
    this.observeNavigation();
    this.observeResources();
    this.observePaint();
    this.observeLongTasks();
  }

  observeNavigation() {
    try {
      const handler = (entry) => {
        this.addEntry({
          id: generateId(),
          type: 'navigation',
          name: normalizeName(entry.name),
          duration: entry.duration,
          ttfb: entry.responseStart - entry.requestStart,
          domContentLoaded: entry.domContentLoadedEventEnd - entry.startTime,
          loadEvent: entry.loadEventEnd - entry.startTime,
          timestamp: nowTimestamp(),
        });
      };
      performance
        .getEntriesByType('navigation')
        .forEach(handler);

      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(handler);
      });
      observer.observe({ type: 'navigation', buffered: true });
    } catch (err) {
      console.warn('Navigation performance observer failed:', err);
    }
  }

  shouldTrackResource(entry) {
    if (!entry) return false;
    if (entry.initiatorType === 'script' || entry.initiatorType === 'link') {
      return true;
    }
    return RESOURCE_PATTERNS.some((pattern) => pattern.test(entry.name));
  }

  observeResources() {
    try {
      const handler = (entry) => {
        if (!this.shouldTrackResource(entry)) return;
        this.addEntry({
          id: generateId(),
          type: 'resource',
          name: normalizeName(entry.name),
          initiatorType: entry.initiatorType,
          duration: entry.duration,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
          timestamp: nowTimestamp(),
        });
      };
      performance
        .getEntriesByType('resource')
        .forEach(handler);
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(handler);
      });
      observer.observe({ type: 'resource', buffered: true });
    } catch (err) {
      console.warn('Resource performance observer failed:', err);
    }
  }

  observePaint() {
    try {
      const handler = (entry) => {
        this.addEntry({
          id: generateId(),
          type: 'paint',
          name: entry.name,
          duration: entry.startTime,
          timestamp: nowTimestamp(),
        });
      };
      performance
        .getEntriesByType('paint')
        .forEach(handler);
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(handler);
      });
      observer.observe({ type: 'paint', buffered: true });
    } catch (err) {
      console.warn('Paint performance observer failed:', err);
    }
  }

  observeLongTasks() {
    try {
      const handler = (entry) => {
        this.addEntry({
          id: generateId(),
          type: 'longtask',
          duration: entry.duration,
          startTime: entry.startTime,
          attribution: entry.attribution?.map((item) => item.name) || [],
          timestamp: nowTimestamp(),
        });
      };
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(handler);
      });
      observer.observe({ type: 'longtask', buffered: true });
    } catch (err) {
      console.warn('LongTask performance observer failed:', err);
    }
  }

  addEntry(entry) {
    if (!entry) return;
    this.entries = [...this.entries.slice(-(MAX_ENTRIES - 1)), entry];
    this.notify();
  }

  recordSectionLoad(name, duration, meta = {}) {
    this.addEntry({
      id: generateId(),
      type: 'section',
      name,
      duration,
      timestamp: nowTimestamp(),
      ...meta,
    });
  }

  recordCustom(entry) {
    this.addEntry({
      id: generateId(),
      type: 'custom',
      timestamp: nowTimestamp(),
      ...entry,
    });
  }

  getEntries() {
    return [...this.entries];
  }

  clear() {
    this.entries = [];
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getEntries());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  notify() {
    const snapshot = this.getEntries();
    this.subscribers.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (err) {
        console.error('Performance metrics subscriber failed:', err);
      }
    });
  }
}

const performanceMetricsService = new PerformanceMetricsService();

export const recordSectionLoadMetric = (name, duration, meta) =>
  performanceMetricsService.recordSectionLoad(name, duration, meta);

export default performanceMetricsService;
