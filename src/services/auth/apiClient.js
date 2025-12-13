export class ApiClient {
  constructor({
    baseUrl,
    scope = 'auth',
    ensureUser,
    ensureCsrfToken,
    recordMetric,
    handleSessionExpiration,
    createNetworkError,
    createSessionExpiredError,
  }) {
    this.baseUrl = baseUrl;
    this.scope = scope;
    this.ensureUser = ensureUser;
    this.ensureCsrfToken = ensureCsrfToken;
    this.recordMetric = recordMetric;
    this.handleSessionExpiration = handleSessionExpiration;
    this.createNetworkError = createNetworkError;
    this.createSessionExpiredError = createSessionExpiredError;
  }

  async request(path, options = {}) {
    const user = await this.ensureUser();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const method = (options.method || 'GET').toUpperCase();
    const csrfToken = await this.ensureCsrfToken();
    if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      headers['X-CSRF-TOKEN'] = csrfToken;
    }

    if (user?.access_token) {
      headers.Authorization = `Bearer ${user.access_token}`;
    }

    const fetchOptions = {
      ...options,
      headers,
      credentials: options.credentials || 'include',
      __skipGlobalMetrics: true,
    };

    const methodUsed = (fetchOptions.method || 'GET').toUpperCase();
    const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const timeoutMs = options.timeoutMs ?? 15000;
    const controller = new AbortController();
    const timeoutId = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

    let response;
    try {
      response = await window.fetch(`${this.baseUrl}${path}`, { ...fetchOptions, signal: controller.signal });
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);

      const isAbort = err?.name === 'AbortError';
      const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;
      this.recordMetric({
        scope: this.scope,
        url: path,
        method: methodUsed,
        status: isAbort ? 'TIMEOUT' : 'NETWORK',
        ok: false,
        duration,
        error: err?.message || (isAbort ? 'Request timeout' : 'Network error'),
      });
      throw this.createNetworkError(err);
    }

    if (timeoutId) clearTimeout(timeoutId);

    const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;
    this.recordMetric({
      scope: this.scope,
      url: path,
      method: methodUsed,
      status: response.status,
      ok: response.ok,
      duration,
    });

    if (response.status === 401) {
      this.handleSessionExpiration();
      throw this.createSessionExpiredError();
    }

    return response;
  }
}

export default ApiClient;
