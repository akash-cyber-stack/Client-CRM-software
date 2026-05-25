/**
 * Adds company contact/GST registry columns + gst_otp_challenges table.
 * Run: node prisma/apply-gst-otp-migration.js && npx prisma db push
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

async function tableExists(name) {
  const rows = await prisma.$queryRaw`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${name}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function main() {
  console.log('GST OTP migration starting…');

  for (const col of ['gst_reg_mobile', 'gst_reg_email', 'contact_phone', 'contact_email']) {
    if (!(await columnExists('companies', col))) {
      console.log(`Adding companies.${col}…`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "companies" ADD COLUMN "${col}" TEXT`);
    }
  }

  if (!(await tableExists('gst_otp_challenges'))) {
    console.log('Creating gst_otp_challenges…');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "gst_otp_challenges" (
        "id" TEXT NOT NULL,
        "gstin" TEXT NOT NULL,
        "mobile_target" TEXT,
        "email_target" TEXT,
        "otp_hash" TEXT NOT NULL,
        "channel" TEXT NOT NULL,
        "verified" BOOLEAN NOT NULL DEFAULT false,
        "legal_name" TEXT,
        "gst_address" TEXT,
        "state_code" TEXT,
        "expires_at" TIMESTAMP(3) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "gst_otp_challenges_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "gst_otp_challenges_gstin_verified_idx"
      ON "gst_otp_challenges"("gstin", "verified")
    `);
  }

  console.log('Done. Run: npx prisma generate && npx prisma db push');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
