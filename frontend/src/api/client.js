import axios from 'axios';

/**
 * Local: Vite proxy `/api` → localhost:5000 (avoids CORS / connection issues).
 * Production: same-origin `/api` (Vercel rewrite).
 */
export function resolveApiUrl() {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  return '/api';
}

const client = axios.create({
  baseURL: resolveApiUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const RETRY_STATUSES = new Set([503, 429]);
const RETRY_METHODS = new Set(['get', 'head']);

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config;
    const status = err.response?.status;
    const method = (config?.method || 'get').toLowerCase();

    if (
      config &&
      !config.__retry &&
      RETRY_STATUSES.has(status) &&
      RETRY_METHODS.has(method)
    ) {
      config.__retry = true;
      await new Promise((r) => setTimeout(r, 800));
      return client.request(config);
    }

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default client;
