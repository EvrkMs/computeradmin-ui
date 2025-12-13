import { ensureOk } from './httpUtils';

export const createAccountApi = (client) => ({
  async getUserInfo() {
    const response = await client.request('/connect/userinfo');
    await ensureOk(response, 'Failed to load user data');
    return response.json();
  },

  async getSessions(all = false) {
    const response = await client.request(`/api/sessions${all ? '?all=true' : ''}`);
    return response.json();
  },

  async getCurrentSession() {
    const response = await client.request('/api/sessions/current');
    return response.json();
  },

  async revokeSession(id) {
    const response = await client.request(`/api/sessions/${id}/revoke`, {
      method: 'POST',
    });
    return response.ok;
  },

  async revokeAllSessions() {
    const response = await client.request('/api/sessions/revoke-all', {
      method: 'POST',
    });
    return response.json();
  },

  async getTelegramInfo() {
    const response = await client.request('/api/telegram/me');
    if (response.ok) {
      return response.json();
    }
    return null;
  },

  async unbindTelegram(password) {
    const response = await client.request('/api/telegram/unbind', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    await ensureOk(response, 'Не удалось отвязать Telegram');
    return true;
  },
});

export default createAccountApi;
