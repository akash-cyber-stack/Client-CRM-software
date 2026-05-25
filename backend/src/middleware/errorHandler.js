import { Prisma } from '@prisma/client';

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function prismaMessage(err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return { status: 409, message: 'Record already exists' };
    if (err.code === 'P2025') return { status: 404, message: 'Record not found' };
    if (['P1001', 'P1002', 'P1008', 'P1017', 'P2024'].includes(err.code)) {
      return { status: 503, message: 'Database is busy. Please retry in a few seconds.', code: 'DB_UNAVAILABLE' };
    }
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return { status: 503, message: 'Database connection failed. Please retry.', code: 'DB_UNAVAILABLE' };
  }
  return null;
}

export function errorHandler(err, req, res, _next) {
  if (res.headersSent) return;

  console.error('[Error]', err.message);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);

  const mapped = prismaMessage(err);
  const status = mapped?.status || err.statusCode || err.status || 500;
  const message = mapped?.message || err.message || 'Internal server error';
  const code = mapped?.code || err.code;

  res.status(status).json({
    success: false,
    message,
    ...(code ? { code } : {}),
    ...(process.env.NODE_ENV === 'development' && err.errors ? { errors: err.errors } : {}),
  });
}
