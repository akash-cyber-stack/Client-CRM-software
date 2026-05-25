import './env.js';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

/** Single client per serverless instance — critical for many companies on Vercel */
const prisma = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = prisma;

export default prisma;
