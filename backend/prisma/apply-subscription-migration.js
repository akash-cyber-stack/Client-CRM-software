/**
 * Adds subscription columns; marks existing companies ACTIVE (grandfathered).
 * Run: node prisma/apply-subscription-migration.js && npx prisma db push
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function columnExists(table, column) {
  const rows = await prisma.$queryRaw`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function main() {
  console.log('Subscription migration…');

  if (!(await columnExists('companies', 'plan'))) {
    await prisma.$executeRawUnsafe(`
      CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
    `).catch(() => {});
    await prisma.$executeRawUnsafe(`
      CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED');
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "companies" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'STARTER';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "companies" ADD COLUMN "subscription_status" TEXT NOT NULL DEFAULT 'PENDING';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "companies" ADD COLUMN "paid_at" TIMESTAMP(3);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "companies" ADD COLUMN "payment_id" TEXT;
    `);

    await prisma.$executeRawUnsafe(`
      UPDATE "companies" SET "subscription_status" = 'ACTIVE', "paid_at" = NOW()
      WHERE "subscription_status" = 'PENDING';
    `);
    console.log('Subscription columns added; existing companies set ACTIVE.');
  }

  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "gst_otp_challenges"`).catch(() => {});

  console.log('Done. Run: npx prisma generate && npx prisma db push');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
