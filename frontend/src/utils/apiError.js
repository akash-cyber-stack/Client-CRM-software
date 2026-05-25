/** User-facing message from axios / API error */
export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return fallback;

  if (!err.response) {
    const code = err.code || '';
    if (code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    if (import.meta.env.DEV) {
      return 'Cannot reach API. Run from project root: npm run dev (starts backend on port 5000 + frontend).';
    }
    return 'Cannot reach server. Please try again in a moment.';
  }

  const data = err.response.data;
  const status = err.response.status;

  if (status === 503 && data?.database) {
    return data.message || 'Database unavailable. Check DATABASE_URL on the server.';
  }

  if (typeof data?.message === 'string') return data.message;
  if (typeof data === 'string') return data;
  return fallback;
}
