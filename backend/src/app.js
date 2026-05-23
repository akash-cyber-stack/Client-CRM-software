import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import prisma from './config/db.js';
import { env, corsOriginCheck } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

app.use(
  cors({
    origin: corsOriginCheck,
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

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
    await prisma.$queryRaw`SELECT 1`;
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

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
