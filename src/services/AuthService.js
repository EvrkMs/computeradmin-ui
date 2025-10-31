import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

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
    const resolvedBaseUrl =
      authApiBaseUrl || envAuthApiBaseUrl || authorityOrigin || origin || '';
    this.authApiBaseUrl = resolvedBaseUrl.replace(/\/+$/, '');
    const clientId = import.meta.env.VITE_OIDC_CLIENT_ID || 'react-spa';
    const redirectUri =
      import.meta.env.VITE_OIDC_REDIRECT_URI || `${origin}/callback`;
    const postLogoutRedirectUri =
      import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI ||
      `${origin}/logout-callback`;
    const silentRedirectUri =
      import.meta.env.VITE_OIDC_SILENT_REDIRECT_URI ||
      `${origin}/silent-callback.html`;
    const scope =
      import.meta.env.VITE_OIDC_SCOPE ||
      'openid profile api api:read api:write telegram';

    this.oidcConfig = {
      authority,
      clientId,
      redirectUri,
      postLogoutRedirectUri,
      silentRedirectUri,
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
      silent_redirect_uri: silentRedirectUri,
      response_type: 'code',
      scope,
      automaticSilentRenew: false,
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

  async fetch(url, options = {}) {
    const user = await this.requireAuthenticatedUser();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (user?.access_token) {
      headers.Authorization = `Bearer ${user.access_token}`;
    }

    const fetchOptions = {
      ...options,
      headers,
      credentials: options.credentials || 'include',
    };

    const response = await window.fetch(`${this.authApiBaseUrl}${url}`, fetchOptions);

    if (response.status === 401) {
      this.handleSessionExpiration();
      throw this.createSessionExpiredError();
    }

    return response;
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

  ensureOk(response, fallbackMessage = 'Request failed') {
    if (!response.ok) {
      const error = new Error(fallbackMessage);
      error.status = response.status;
      return error;
    }
    return null;
  }

  async restoreSession() {
    return this.restoreUser();
  }

  async getUserInfo() {
    const response = await this.fetch('/connect/userinfo');
    const error = this.ensureOk(response, 'Failed to load user data');
    if (error) throw error;
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

  async unbindTelegram() {
    const response = await this.fetch('/api/telegram/unbind', {
      method: 'POST',
    });
    return response.json();
  }

  async getUsers(query = '', status = '') {
    let url = '/api/cruduser';
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params}`;

    const response = await this.fetch(url);
    return response.json();
  }

  async getUser(id) {
    const response = await this.fetch(`/api/cruduser/${id}`);
    return response.json();
  }

  async getRoles() {
    const response = await this.fetch('/api/cruduser/roles');
    return response.json();
  }

  async createUser(userData) {
    const response = await this.fetch('/api/cruduser', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.json();
  }

  async resetPassword(userId, newPassword, requireChange = true) {
    const response = await this.fetch(`/api/cruduser/${userId}/password`, {
      method: 'POST',
      body: JSON.stringify({
        newPassword,
        requireChangeOnNextLogin: requireChange,
      }),
    });
    return response.ok;
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

  getAuthorizationUrl(path) {
    const trimmedPath = path?.startsWith('/') ? path : `/${path || ''}`;
    return `${this.authorityOrigin}${trimmedPath}`;
  }
}

export default AuthService;
