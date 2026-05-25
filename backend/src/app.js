import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import prisma from './config/db.js';
import { env, corsOriginCheck } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { rateLimitByIp, requestTimeout } from './middleware/resilience.js';
import { withDbRetry } from './utils/dbRetry.js';

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(requestTimeout);

app.use(
  cors({
    origin: corsOriginCheck,
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

/** Backend only — open the frontend URL in the browser for the CRM UI */
app.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'sales-lead-crm-api',
    message: 'This is the API server. Open the frontend URL for the dashboard.',
    frontend: env.frontendUrl,
    endpoints: { health: '/api/health', login: '/api/auth/login' },
  });
});

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running. Prefix routes with /api — e.g. /api/health',
    health: '/api/health',
  });
});

app.get('/api/health', async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({
      ok: false,
      service: 'sales-lead-crm-api',
      database: 'missing',
      hint: 'Set DATABASE_URL in Vercel → Project ar-crm-iota → Settings → Environment Variables, then Redeploy.',
    });
  }
  try {
    await withDbRetry(() => prisma.$queryRaw`SELECT 1`);
    res.json({ ok: true, service: 'sales-lead-crm-api', database: 'connected' });
  } catch (err) {
    res.status(503).json({
      ok: false,
      service: 'sales-lead-crm-api',
      database: 'error',
      message: err.message,
    });
  }
});

app.use('/api', rateLimitByIp, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
