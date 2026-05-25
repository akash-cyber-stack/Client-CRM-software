import { DB_RETRY_ATTEMPTS, DB_RETRY_DELAY_MS } from '../constants/limits.js';

const TRANSIENT_CODES = new Set([
  'P1001', // Can't reach database
  'P1002', // Timed out
  'P1008', // Operations timed out
  'P1017', // Server closed connection
  'P2024', // Pool timeout
]);

const TRANSIENT_MESSAGE = /can't reach database|connection|timeout|ECONNRESET|ETIMEDOUT|socket/i;

function isTransientError(err) {
  if (!err) return false;
  if (TRANSIENT_CODES.has(err.code)) return true;
  return TRANSIENT_MESSAGE.test(String(err.message || ''));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry Neon/Prisma blips — common when many tenants hit cold starts */
export async function withDbRetry(fn, attempts = DB_RETRY_ATTEMPTS) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientError(err) || i === attempts - 1) throw err;
      await sleep(DB_RETRY_DELAY_MS * (i + 1));
    }
  }
  throw lastError;
}
