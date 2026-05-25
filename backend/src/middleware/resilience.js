import {
  REQUEST_TIMEOUT_MS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_PER_IP,
  RATE_LIMIT_MAX_AUTH_PER_IP,
} from '../constants/limits.js';

const ipBuckets = new Map();

function pruneBuckets(now) {
  if (ipBuckets.size < 5000) return;
  for (const [key, bucket] of ipBuckets) {
    if (now - bucket.start > RATE_LIMIT_WINDOW_MS * 2) ipBuckets.delete(key);
  }
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function hitLimit(key, max) {
  const now = Date.now();
  pruneBuckets(now);
  let bucket = ipBuckets.get(key);
  if (!bucket || now - bucket.start > RATE_LIMIT_WINDOW_MS) {
    bucket = { start: now, count: 0 };
    ipBuckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count > max;
}

/** Per-IP rate limit — stops one client from exhausting DB connections */
export function rateLimitByIp(req, res, next) {
  const ip = clientIp(req);
  const isAuth = req.path.startsWith('/auth');
  const max = isAuth ? RATE_LIMIT_MAX_AUTH_PER_IP : RATE_LIMIT_MAX_PER_IP;
  const key = `${ip}:${isAuth ? 'auth' : 'api'}`;

  if (hitLimit(key, max)) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait a moment and try again.',
      code: 'RATE_LIMITED',
    });
  }
  return next();
}

/** Vercel max 30s — respond before platform kills the function */
export function requestTimeout(req, res, next) {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT',
      });
    }
  }, REQUEST_TIMEOUT_MS);

  const end = res.end.bind(res);
  res.end = (...args) => {
    clearTimeout(timer);
    return end(...args);
  };
  next();
}
