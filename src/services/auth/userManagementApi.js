import { ensureOk } from './httpUtils';

export const createUserManagementApi = (client) => ({
  async getUsers(query = '', status = '') {
    let url = '/api/cruduser';
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params}`;

    const response = await client.request(url);
    await ensureOk(response, 'Не удалось загрузить пользователей');
    return response.json();
  },

  async getUser(id) {
    const response = await client.request(`/api/cruduser/${id}`);
    await ensureOk(response, 'Не удалось загрузить пользователя');
    return response.json();
  },

  async getRoles() {
    const response = await client.request('/api/cruduser/roles');
    await ensureOk(response, 'Не удалось загрузить роли');
    return response.json();
  },

  async createUser(userData) {
    const response = await client.request('/api/cruduser', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    await ensureOk(response, 'Не удалось создать пользователя');
    return response.json();
  },

  async updateUser(userId, payload) {
    const response = await client.request(`/api/cruduser/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    await ensureOk(response, 'Не удалось обновить пользователя');
    return response.json();
  },

  async createRole(name) {
    const response = await client.request('/api/cruduser/roles', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    await ensureOk(response, 'Не удалось создать роль');
    return response.json();
  },

  async updateRole(roleId, name) {
    const response = await client.request(`/api/cruduser/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    await ensureOk(response, 'Не удалось обновить роль');
    return response.json();
  },

  async deleteRole(roleId) {
    const response = await client.request(`/api/cruduser/roles/${roleId}`, {
      method: 'DELETE',
    });
    await ensureOk(response, 'Не удалось удалить роль');
    return true;
  },

  async resetPassword(userId, newPassword, requireChange = true) {
    const response = await client.request(`/api/cruduser/${userId}/password`, {
      method: 'POST',
      body: JSON.stringify({
        newPassword,
        requireChangeOnNextLogin: requireChange,
      }),
    });
    await ensureOk(response, 'Не удалось сбросить пароль');
    return true;
  },
});

export default createUserManagementApi;
