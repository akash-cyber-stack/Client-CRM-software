/**
 * Test Neon connectivity. Run from repo root:
 *   node scripts/test-neon-connection.js
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const url = process.env.DATABASE_URL || '';
const isPooled = url.includes('-pooler') || url.includes('pooler');
const hasPgbouncer = url.includes('pgbouncer=true');

const prisma = new PrismaClient();

async function main() {
  console.log('DATABASE_URL host:', url.replace(/:[^:@]+@/, ':****@').split('?')[0]);
  console.log('Pooled host:', isPooled ? 'yes' : 'NO — use -pooler in hostname');
  console.log('pgbouncer=true:', hasPgbouncer ? 'yes' : 'recommended for Prisma');

  const start = Date.now();
  await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log(`Connected in ${Date.now() - start} ms`);
}

main()
  .catch((err) => {
    console.error('Connection failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
