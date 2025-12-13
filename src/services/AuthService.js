import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import requestMetricsService from './metrics/RequestMetricsService';
import ApiClient from './auth/apiClient';
import { createAccountApi } from './auth/accountApi';
import { createUserManagementApi } from './auth/userManagementApi';
import { createSafeApi } from './auth/safeApi';

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

    // Разделяем по областям, чтобы сам сервис был компактнее
    this.accountApi = createAccountApi(this.authApi);
    this.userManagementApi = createUserManagementApi(this.authApi);
    this.safeApiClient = createSafeApi(this.safeApi);
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

  async restoreSession() {
    return this.restoreUser();
  }

  async getUserInfo() {
    return this.accountApi.getUserInfo();
  }

  async getSessions(all = false) {
    return this.accountApi.getSessions(all);
  }

  async getCurrentSession() {
    return this.accountApi.getCurrentSession();
  }

  async revokeSession(id) {
    return this.accountApi.revokeSession(id);
  }

  async revokeAllSessions() {
    return this.accountApi.revokeAllSessions();
  }

  async getTelegramInfo() {
    return this.accountApi.getTelegramInfo();
  }

  async unbindTelegram(password) {
    return this.accountApi.unbindTelegram(password);
  }

  async getUsers(query = '', status = '') {
    return this.userManagementApi.getUsers(query, status);
  }

  async getUser(id) {
    return this.userManagementApi.getUser(id);
  }

  async getRoles() {
    return this.userManagementApi.getRoles();
  }

  async createUser(userData) {
    return this.userManagementApi.createUser(userData);
  }

  async updateUser(userId, payload) {
    return this.userManagementApi.updateUser(userId, payload);
  }

  async createRole(name) {
    return this.userManagementApi.createRole(name);
  }

  async updateRole(roleId, name) {
    return this.userManagementApi.updateRole(roleId, name);
  }

  async deleteRole(roleId) {
    return this.userManagementApi.deleteRole(roleId);
  }

  async resetPassword(userId, newPassword, requireChange = true) {
    return this.userManagementApi.resetPassword(userId, newPassword, requireChange);
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

  async getSafeBalance() {
    return this.safeApiClient.getSafeBalance();
  }

  async getSafeChanges(query = {}) {
    return this.safeApiClient.getSafeChanges(query);
  }

  async createSafeChange(payload) {
    return this.safeApiClient.createSafeChange(payload);
  }

  async reverseSafeChange(id, comment) {
    return this.safeApiClient.reverseSafeChange(id, comment);
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
