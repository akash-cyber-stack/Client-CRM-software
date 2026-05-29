import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "auth_otp_challenges" (
      "id" TEXT NOT NULL,
      "email" TEXT NOT NULL DEFAULT '',
      "phone" TEXT,
      "purpose" TEXT NOT NULL DEFAULT 'auth',
      "otp_hash" TEXT NOT NULL,
      "verified" BOOLEAN NOT NULL DEFAULT false,
      "expires_at" TIMESTAMP(3) NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "auth_otp_challenges_pkey" PRIMARY KEY ("id")
    );
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "auth_otp_challenges" ADD COLUMN IF NOT EXISTS "phone" TEXT;
  `).catch(() => {});
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "auth_otp_challenges_email_verified_idx"
    ON "auth_otp_challenges" ("email", "verified");
  `).catch(() => {});
  console.log('auth_otp_challenges table ready');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
