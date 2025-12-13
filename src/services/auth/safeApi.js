import { ensureOk } from './httpUtils';

export const createSafeApi = (client) => ({
  async getSafeBalance() {
    const response = await client.request('/api/safe/balance');
    await ensureOk(response, 'Не удалось загрузить баланс сейфа');
    return response.json();
  },

  async getSafeChanges(query = {}) {
    const params = new URLSearchParams();
    if (query.page) params.append('page', String(query.page));
    if (query.pageSize) params.append('pageSize', String(query.pageSize));
    if (query.status) params.append('status', query.status);
    if (query.from) params.append('from', query.from);
    if (query.to) params.append('to', query.to);
    const qs = params.toString();
    const url = `/api/safe/changes${qs ? `?${qs}` : ''}`;
    const response = await client.request(url);
    await ensureOk(response, 'Не удалось загрузить операции сейфа');
    return response.json();
  },

  async createSafeChange(payload) {
    const response = await client.request('/api/safe/changes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await ensureOk(response, 'Не удалось создать операцию');
    return response.json();
  },

  async reverseSafeChange(id, comment) {
    const response = await client.request(`/api/safe/changes/${id}/reverse`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
    await ensureOk(response, 'Не удалось выполнить реверс операции');
    return true;
  },
});

export default createSafeApi;
