function parseResponseData(data) {
  if (!data) return null;
  if (typeof data === 'object' && typeof data.message === 'string') return data.message;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed?.message === 'string') return parsed.message;
    } catch {
      if (data.length < 200) return data;
    }
  }
  return null;
}

/** User-facing message from axios / API error */
export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return fallback;

  const msg = String(err.message || '');
  if (/JSON|Unexpected token/i.test(msg)) {
    return 'Server response error. Please refresh and try again.';
  }

  if (!err.response) {
    const code = err.code || '';
    if (code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    if (import.meta.env.DEV) {
      return 'Cannot reach API. Run: npm run dev (backend port 5000 + frontend).';
    }
    return 'Cannot reach server. Check your connection and try again.';
  }

  const data = err.response.data;
  const status = err.response.status;

  if (status === 503) {
    return parseResponseData(data) || 'Service temporarily unavailable. Please retry.';
  }

  if (status === 429) {
    return parseResponseData(data) || 'Too many requests. Please wait a moment.';
  }

  const parsed = parseResponseData(data);
  if (parsed) return parsed;
  return fallback;
}
