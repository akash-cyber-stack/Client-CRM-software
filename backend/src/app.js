import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'sales-lead-crm-api' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
