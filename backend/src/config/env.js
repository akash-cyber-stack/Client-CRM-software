import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/** Strip whitespace/newlines from Vercel env vars (common when pasted via CLI) */
function cleanEnv(value, fallback = '') {
  if (value == null || value === '') return fallback;
  const trimmed = String(value).trim().replace(/[\r\n]+/g, '');
  return trimmed || fallback;
}

/** jwt.sign expiresIn must be seconds (number) or timespan string e.g. 7d, 12h */
function parseJwtExpiresIn(value) {
  const raw = cleanEnv(value, '7d');
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  if (/^\d+\s*(ms|s|m|h|d|w|y)$/i.test(raw) || /^\d+[smhdwy]$/i.test(raw)) return raw;
  return '7d';
}

function buildCorsOrigins() {
  const origins = new Set();
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  frontend.split(',').forEach((o) => origins.add(o.trim()));

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.VERCEL_BRANCH_URL) {
    origins.add(`https://${process.env.VERCEL_BRANCH_URL}`);
  }

  return [...origins].filter(Boolean);
}

/** Allow Vercel preview/production origins when FRONTEND_URL is wrong or missing */
export function corsOriginCheck(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }
  const allowed = buildCorsOrigins();
  if (allowed.includes(origin)) {
    callback(null, true);
    return;
  }
  if (/^https:\/\/[\w-]+\.vercel\.app$/i.test(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error('Not allowed by CORS'));
}

export const env = {
  port: parseInt(cleanEnv(process.env.PORT, '5000'), 10),
  nodeEnv: cleanEnv(process.env.NODE_ENV, 'development'),
  jwtSecret: cleanEnv(process.env.JWT_SECRET, 'dev-secret-change-me'),
  jwtExpiresIn: parseJwtExpiresIn(process.env.JWT_EXPIRES_IN),
  frontendUrl: cleanEnv(process.env.FRONTEND_URL, 'http://localhost:5173'),
  corsOrigins: buildCorsOrigins(),
  googleWebhookSecret: process.env.GOOGLE_WEBHOOK_SECRET || '',
  metaWebhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || '',
  metaWebhookSecret: process.env.META_WEBHOOK_SECRET || '',
  ivrWebhookSecret: process.env.IVR_WEBHOOK_SECRET || '',
};
