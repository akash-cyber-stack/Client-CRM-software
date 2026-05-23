/** User-facing message from axios / API error */
export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return fallback;
  if (!err.response) {
    return 'Cannot reach server. Is backend running? (local: port 5000)';
  }
  const data = err.response.data;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data === 'string') return data;
  return fallback;
}
