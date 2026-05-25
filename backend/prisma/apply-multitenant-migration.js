/**
 * Safe migration: adds companies + company_id to existing Neon/Postgres data.
 * Run: node prisma/apply-multitenant-migration.js
 * Then: npx prisma db push
 */
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const DEFAULT_GSTIN = '27AABCU9603R1ZP';
const DEFAULT_COMPANY_NAME = 'Default Organization';

async function tableExists(name) {
  const rows = await prisma.$queryRaw`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${name}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function columnExists(table, column) {
  const rows = await prisma.$queryRaw`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function main() {
  console.log('Multi-tenant migration starting…');

  if (!(await tableExists('companies'))) {
    console.log('Creating companies table…');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "companies" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "gstin" TEXT NOT NULL,
        "gst_legal_name" TEXT,
        "gst_address" TEXT,
        "gst_state_code" TEXT,
        "gst_verified" BOOLEAN NOT NULL DEFAULT false,
        "gst_verified_at" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "companies_gstin_key" ON "companies"("gstin");`
    );
  }

  const existingCo = await prisma.$queryRaw`
    SELECT id FROM companies WHERE gstin = ${DEFAULT_GSTIN} LIMIT 1
  `;
  let companyId = existingCo[0]?.id;

  if (!companyId) {
    companyId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO companies (id, name, gstin, gst_legal_name, gst_verified, gst_verified_at, status, created_at, updated_at)
      VALUES (${companyId}, ${DEFAULT_COMPANY_NAME}, ${DEFAULT_GSTIN}, ${DEFAULT_COMPANY_NAME}, true, NOW(), 'ACTIVE', NOW(), NOW())
    `;
    console.log('Created default company:', companyId);
  } else {
    console.log('Using existing company:', companyId);
  }

  const tables = ['users', 'leads', 'campaigns', 'call_logs', 'settings', 'webhook_logs'];

  for (const table of tables) {
    if (!(await tableExists(table))) continue;
    if (!(await columnExists(table, 'company_id'))) {
      console.log(`Adding company_id to ${table}…`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "company_id" TEXT;`);
    }
    await prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "company_id" = '${companyId}' WHERE "company_id" IS NULL`
    );
  }

  if (await tableExists('lead_assignment_state')) {
    const hasCompanyCol = await columnExists('lead_assignment_state', 'company_id');
    if (!hasCompanyCol) {
      console.log('Migrating lead_assignment_state…');
      const state = await prisma.$queryRaw`SELECT last_employee_id FROM lead_assignment_state LIMIT 1`;
      const lastEmp = state[0]?.last_employee_id || null;
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "lead_assignment_state_old";`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "lead_assignment_state" RENAME TO "lead_assignment_state_old";`);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "lead_assignment_state" (
          "company_id" TEXT NOT NULL,
          "last_employee_id" TEXT,
          CONSTRAINT "lead_assignment_state_pkey" PRIMARY KEY ("company_id")
        );
      `);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "lead_assignment_state" ("company_id", "last_employee_id") VALUES ('${companyId}', ${lastEmp ? `'${lastEmp}'` : 'NULL'})`
      );
      await prisma.$executeRawUnsafe(`DROP TABLE "lead_assignment_state_old";`);
    }
  }

  console.log('');
  console.log('Migration data step complete.');
  console.log('Default login GST:', DEFAULT_GSTIN);
  console.log('Next: npx prisma db push');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
