import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import requestMetricsService from './metrics/RequestMetricsService';
import ApiClient from './auth/apiClient';

class AuthService {
  constructor(authApiBaseUrl) {
    const envAuthApiBaseUrl =
      import.meta.env.VITE_AUTH_API_BASE_URL || import.meta.env.VITE_API_BASE_URL;
    this.sessionExpiredHandler = null;
    this.user = null;

    const origin =
      typeof window !== 'undefined' && window.location ? window.location.origin : '';

    const toOrigin = (value, base) => {
      if (!value) return base;
      try {
        return new URL(value, base || 'https://placeholder.local').origin;
      } catch (_) {
        return base;
      }
    };

    const authority =
      import.meta.env.VITE_OIDC_AUTHORITY || envAuthApiBaseUrl || origin;
    const authorityOrigin = toOrigin(authority, origin);
    const resolveBase = (url, fallback) => {
      if (!url) return fallback;
      try {
        return new URL(url).origin;
      } catch {
        return url.replace(/\/+$/, '');
      }
    };

    const resolvedAuthBase =
      authApiBaseUrl || envAuthApiBaseUrl || authorityOrigin || origin || '';
    this.authApiBaseUrl = resolvedAuthBase.replace(/\/+$/, '');

    const safeEnvBase = import.meta.env.VITE_SAFE_API_BASE_URL;
    this.safeApiBaseUrl = resolveBase(safeEnvBase, this.authApiBaseUrl);
    const clientId = import.meta.env.VITE_OIDC_CLIENT_ID || 'react-spa';
    const redirectUri =
      import.meta.env.VITE_OIDC_REDIRECT_URI || `${origin}/callback`;
    const postLogoutRedirectUri =
      import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI ||
      `${origin}/logout-callback`;
    const scope =
      import.meta.env.VITE_OIDC_SCOPE ||
      'openid profile api api:read api:write telegram';

    this.oidcConfig = {
      authority,
      clientId,
      redirectUri,
      postLogoutRedirectUri,
      scope,
    };

    this.redirectPath = new URL(redirectUri).pathname;
    this.logoutCallbackPath = new URL(postLogoutRedirectUri).pathname;
    this.authorityOrigin = authority.replace(/\/+$/, '');

    this.manager = new UserManager({
      authority,
      client_id: clientId,
      redirect_uri: redirectUri,
      post_logout_redirect_uri: postLogoutRedirectUri,
      response_type: 'code',
      scope,
      monitorSession: false,
      loadUserInfo: false,
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    });

    this.manager.events.addAccessTokenExpired(() => {
      this.handleSessionExpiration();
    });
    this.manager.events.addUserUnloaded(() => {
      this.clearTokens();
    });

    this.csrfToken = null;

    this.authApi = this.createApiClient(this.authApiBaseUrl, 'auth');
    this.safeApi = this.createApiClient(this.safeApiBaseUrl, 'safe');
  }

  handleSessionExpiration() {
    const error = this.createSessionExpiredError();
    this.clearTokens();
    if (typeof this.sessionExpiredHandler === 'function') {
      this.sessionExpiredHandler(error);
    }
  }

  applyUser(user) {
    this.user = user;
  }

  async restoreUser() {
    const stored = await this.manager.getUser();
    if (stored && !stored.expired) {
      this.applyUser(stored);
      return stored;
    }
    if (stored && stored.expired) {
      this.handleSessionExpiration();
      return null;
    }
    this.clearTokens();
    return null;
  }

  async requireAuthenticatedUser() {
    if (this.user && !this.user.expired) {
      return this.user;
    }
    const stored = await this.restoreUser();
    if (stored) {
      return stored;
    }
    throw this.createSessionExpiredError();
  }

  recordMetric({ scope, url, method, status, ok, duration, error }) {
    requestMetricsService.addEntry({
      scope,
      url,
      method,
      status,
      ok,
      duration,
      error,
      timestamp: Date.now(),
    });
  }

  async fetch(url, options = {}) {
    return this.authApi.request(url, options);
  }

  async safeFetch(path, options = {}) {
    return this.safeApi.request(path, options);
  }

  onSessionExpired(handler) {
    this.sessionExpiredHandler = handler;
  }

  createSessionExpiredError() {
    const error = new Error('Session expired');
    error.code = 'SESSION_EXPIRED';
    error.status = 401;
    return error;
  }

  createNetworkError(originalError) {
    const error = new Error('Auth service unavailable');
    error.code = 'NETWORK_ERROR';
    error.cause = originalError;
    return error;
  }

  async ensureOk(response, fallbackMessage = 'Request failed') {
    if (response.ok) return;

    let message = fallbackMessage;
    try {
      const cloned = response.clone();
      const contentType = cloned.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await cloned.json();
        message = this.extractErrorMessage(data, fallbackMessage);
      } else {
        const text = await cloned.text();
        if (text) {
          message = text;
        }
      }
    } catch {
      // Ignore parse errors and use fallback
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  async restoreSession() {
    return this.restoreUser();
  }

  async getUserInfo() {
    const response = await this.fetch('/connect/userinfo');
    await this.ensureOk(response, 'Failed to load user data');
    return response.json();
  }

  async getSessions(all = false) {
    const response = await this.fetch(`/api/sessions${all ? '?all=true' : ''}`);
    return response.json();
  }

  async getCurrentSession() {
    const response = await this.fetch('/api/sessions/current');
    return response.json();
  }

  async revokeSession(id) {
    const response = await this.fetch(`/api/sessions/${id}/revoke`, {
      method: 'POST',
    });
    return response.ok;
  }

  async revokeAllSessions() {
    const response = await this.fetch('/api/sessions/revoke-all', {
      method: 'POST',
    });
    return response.json();
  }

  async getTelegramInfo() {
    const response = await this.fetch('/api/telegram/me');
    if (response.ok) {
      return response.json();
    }
    return null;
  }

  async unbindTelegram(password) {
    const response = await this.fetch('/api/telegram/unbind', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    await this.ensureOk(response, 'Не удалось отвязать Telegram');
    return true;
  }

  async getUsers(query = '', status = '') {
    let url = '/api/cruduser';
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params}`;

    const response = await this.fetch(url);
    await this.ensureOk(response, 'Не удалось загрузить пользователей');
    return response.json();
  }

  async getUser(id) {
    const response = await this.fetch(`/api/cruduser/${id}`);
    await this.ensureOk(response, 'Не удалось загрузить пользователя');
    return response.json();
  }

  async getRoles() {
    const response = await this.fetch('/api/cruduser/roles');
    await this.ensureOk(response, 'Не удалось загрузить роли');
    return response.json();
  }

  async createUser(userData) {
    const response = await this.fetch('/api/cruduser', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    await this.ensureOk(response, 'Не удалось создать пользователя');
    return response.json();
  }

  async updateUser(userId, payload) {
    const response = await this.fetch(`/api/cruduser/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    await this.ensureOk(response, 'Не удалось обновить пользователя');
    return response.json();
  }

  async createRole(name) {
    const response = await this.fetch('/api/cruduser/roles', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    await this.ensureOk(response, 'Не удалось создать роль');
    return response.json();
  }

  async updateRole(roleId, name) {
    const response = await this.fetch(`/api/cruduser/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    await this.ensureOk(response, 'Не удалось обновить роль');
    return response.json();
  }

  async deleteRole(roleId) {
    const response = await this.fetch(`/api/cruduser/roles/${roleId}`, {
      method: 'DELETE',
    });
    await this.ensureOk(response, 'Не удалось удалить роль');
    return true;
  }

  async resetPassword(userId, newPassword, requireChange = true) {
    const response = await this.fetch(`/api/cruduser/${userId}/password`, {
      method: 'POST',
      body: JSON.stringify({
        newPassword,
        requireChangeOnNextLogin: requireChange,
      }),
    });
    await this.ensureOk(response, 'Не удалось сбросить пароль');
    return true;
  }

  async login(returnUrl = window.location.href) {
    await this.manager.signinRedirect({
      state: { returnUrl },
    });
  }

  async handleSignInCallback(url = window.location.href) {
    const user = await this.manager.signinCallback(url);
    this.applyUser(user);
    return user?.state?.returnUrl || '/';
  }

  isSignInCallback(url = window.location.href) {
    try {
      const parsed = new URL(url, window.location.origin);
      return (
        parsed.pathname === this.redirectPath &&
        (parsed.searchParams.has('code') || parsed.searchParams.has('error'))
      );
    } catch {
      return false;
    }
  }

  async logout(returnUrl = window.location.href) {
    this.clearTokens();
    await this.manager.signoutRedirect({
      state: { returnUrl },
    });
  }

  async handleLogoutCallback(url = window.location.href) {
    const response = await this.manager.signoutCallback(url);
    this.clearTokens();
    return response?.state?.returnUrl || '/';
  }

  isLogoutCallback(url = window.location.href) {
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.pathname === this.logoutCallbackPath;
    } catch {
      return false;
    }
  }

  async removeStoredUser() {
    await this.manager.removeUser();
    this.clearTokens();
  }

  clearTokens() {
    this.user = null;
  }

  async ensureCsrfToken() {
    if (this.csrfToken) return this.csrfToken;
    // пробуем достать из куки
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)__Host-af=([^;]+)/);
      if (match) {
        this.csrfToken = decodeURIComponent(match[1]);
        return this.csrfToken;
      }
    }

    try {
      const response = await fetch(`${this.authApiBaseUrl}/api/antiforgery/token`, {
        credentials: 'include',
      });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      this.csrfToken = data?.token || null;
      return this.csrfToken;
    } catch {
      return null;
    }
  }

  getAuthorizationUrl(path, params = {}) {
    const trimmedPath = path?.startsWith('/') ? path : `/${path || ''}`;
    const url = new URL(`${this.authorityOrigin}${trimmedPath}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  }

  getTelegramFlowUrl(path, returnUrl) {
    const baseReturnUrl = returnUrl || this.oidcConfig.redirectUri;

    return this.getAuthorizationUrl(path, {
      returnUrl: baseReturnUrl,
      client_id: this.oidcConfig.clientId,
    });
  }

  extractErrorMessage(data, fallback) {
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    if (data.detail && typeof data.detail === 'string') return data.detail;
    if (data.error_description && typeof data.error_description === 'string') {
      return data.error_description;
    }
    if (data.message && typeof data.message === 'string') return data.message;
    if (data.title && typeof data.title === 'string') return data.title;
    if (data.errors && typeof data.errors === 'object') {
      const messages = Object.values(data.errors)
        .flat()
        .filter((item) => typeof item === 'string');
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
    return fallback;
  }

  async getSafeBalance() {
    const response = await this.safeFetch('/api/safe/balance');
    await this.ensureOk(response, 'Не удалось загрузить баланс сейфа');
    return response.json();
  }

  async getSafeChanges(query = {}) {
    const params = new URLSearchParams();
    if (query.page) params.append('page', String(query.page));
    if (query.pageSize) params.append('pageSize', String(query.pageSize));
    if (query.status) params.append('status', query.status);
    if (query.from) params.append('from', query.from);
    if (query.to) params.append('to', query.to);
    const qs = params.toString();
    const url = `/api/safe/changes${qs ? `?${qs}` : ''}`;
    const response = await this.safeFetch(url);
    await this.ensureOk(response, 'Не удалось загрузить операции сейфа');
    return response.json();
  }

  async createSafeChange(payload) {
    const response = await this.safeFetch('/api/safe/changes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await this.ensureOk(response, 'Не удалось создать операцию');
    return response.json();
  }

  async reverseSafeChange(id, comment) {
    const response = await this.safeFetch(`/api/safe/changes/${id}/reverse`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
    await this.ensureOk(response, 'Не удалось выполнить реверс операции');
    return true;
  }

  createApiClient(baseUrl, scope) {
    return new ApiClient({
      baseUrl,
      scope,
      ensureUser: () => this.requireAuthenticatedUser(),
      ensureCsrfToken: () => this.ensureCsrfToken(),
      recordMetric: (entry) => this.recordMetric(entry),
      handleSessionExpiration: () => this.handleSessionExpiration(),
      createNetworkError: (err) => this.createNetworkError(err),
      createSessionExpiredError: () => this.createSessionExpiredError(),
    });
  }
}

export default AuthService;
