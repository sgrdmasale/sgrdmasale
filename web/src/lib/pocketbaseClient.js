const API_URL = import.meta.env.API_URL || '/hcgi/api/db';
const STORAGE_KEY = 'sgrd-mongo-auth';

class AuthStore {
  constructor() {
    this.listeners = new Set();
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); this.token = saved?.token || ''; this.record = saved?.record || null; } catch { this.token = ''; this.record = null; }
  }
  get model() { return this.record; }
  get isValid() { return Boolean(this.token && this.record); }
  save(token, record) { this.token = token; this.record = record; localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, record })); this.listeners.forEach((listener) => listener(token, record)); }
  clear() { this.token = ''; this.record = null; localStorage.removeItem(STORAGE_KEY); this.listeners.forEach((listener) => listener('', null)); }
  onChange(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}

const authStore = new AuthStore();

export async function apiRequest(path, { method = 'GET', body, query } = {}) {
  const url = new URL(`${API_URL}${path}`, window.location.origin);
  Object.entries(query || {}).forEach(([key, value]) => value !== undefined && value !== '' && url.searchParams.set(key, value));
  const headers = {};
  if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(url, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  if (response.status === 204) return true;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.message || data.error || 'Request failed'); error.status = response.status; error.data = data; throw error; }
  return data;
}

function collection(name) {
  return {
    async getList(page = 1, perPage = 30, options = {}) { return apiRequest(`/collections/${name}`, { query: { page, perPage, filter: options.filter, sort: options.sort, fields: options.fields } }); },
    async getFullList(options = {}) { const response = await apiRequest(`/collections/${name}`, { query: { page: 1, perPage: 500, filter: options.filter, sort: options.sort, fields: options.fields } }); return response.items; },
    async getFirstListItem(filter, options = {}) { const response = await apiRequest(`/collections/${name}`, { query: { page: 1, perPage: 1, filter, sort: options.sort } }); if (!response.items[0]) { const error = new Error('Record not found'); error.status = 404; throw error; } return response.items[0]; },
    async getOne(id) { return apiRequest(`/collections/${name}/${id}`); },
    async create(data) { const response = await apiRequest(`/collections/${name}`, { method: 'POST', body: data }); if (response.token) authStore.save(response.token, response.record); return response.record || response; },
    async update(id, data) { return apiRequest(`/collections/${name}/${id}`, { method: 'PATCH', body: data }); },
    async delete(id) { return apiRequest(`/collections/${name}/${id}`, { method: 'DELETE' }); },
    async authWithPassword(identity, password) { const response = await apiRequest(`/auth/${name}`, { method: 'POST', body: { identity, password } }); authStore.save(response.token, response.record); return response; },
    async authRefresh() { if (!authStore.isValid) throw new Error('Authentication is required'); return { token: authStore.token, record: authStore.record }; },
    async requestPasswordReset() { throw new Error('Password reset is not configured on the MongoDB API yet.'); },
  };
}

const files = {
  getUrl(_record, filename) { return filename?.startsWith('http') ? filename : `${API_URL.replace('/db', '')}/uploads/${filename}`; },
  getURL(record, filename) { return this.getUrl(record, filename); },
};

const pocketbaseClient = {
  authStore,
  collection,
  files,
  async send(path, options = {}) { return apiRequest(path.replace('/api/custom', '/custom'), { method: options.method || 'GET', body: options.body }); },
};

export default pocketbaseClient;
export { pocketbaseClient };
