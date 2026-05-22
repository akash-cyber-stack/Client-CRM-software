import dotenv from 'dotenv';
dotenv.config();

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
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  corsOrigins: buildCorsOrigins(),
  googleWebhookSecret: process.env.GOOGLE_WEBHOOK_SECRET || '',
  metaWebhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || '',
  metaWebhookSecret: process.env.META_WEBHOOK_SECRET || '',
  ivrWebhookSecret: process.env.IVR_WEBHOOK_SECRET || '',
};
