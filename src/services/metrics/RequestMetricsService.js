const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

class RequestMetricsService {
  constructor() {
    this.entries = [];
    this.subscribers = new Set();
    this.maxEntries = 200;
  }

  addEntry(entry) {
    const withMeta = {
      id: generateId(),
      ...entry,
    };
    this.entries = [...this.entries.slice(-(this.maxEntries - 1)), withMeta];
    this.notify();
  }

  clear() {
    this.entries = [];
    this.notify();
  }

  getEntries() {
    return [...this.entries];
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
        console.error('Metrics subscriber failed:', err);
      }
    });
  }
}

const requestMetricsService = new RequestMetricsService();

export default requestMetricsService;
