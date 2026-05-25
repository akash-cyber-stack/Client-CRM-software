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

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
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
