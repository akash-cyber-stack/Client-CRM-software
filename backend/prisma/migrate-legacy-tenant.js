/**
 * One-time migration: attach existing rows to a default company.
 * Run after `npx prisma db push` when upgrading from single-tenant schema.
 *
 *   node backend/prisma/migrate-legacy-tenant.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_GSTIN = '29AAAAA0000A1Z5';
const DEFAULT_COMPANY = 'Legacy Organization';

async function main() {
  const companies = await prisma.company.count();
  if (companies > 0) {
    console.log('Companies already exist — skipping legacy migration.');
    return;
  }

  console.log('Creating default company for existing data…');

  const company = await prisma.company.create({
    data: {
      name: DEFAULT_COMPANY,
      gstin: DEFAULT_GSTIN,
      gstLegalName: DEFAULT_COMPANY,
      gstVerified: true,
      gstVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  await prisma.leadAssignmentState.create({ data: { companyId: company.id } });

  const settings = await prisma.$queryRaw`
    SELECT id, key, value FROM settings WHERE company_id IS NULL
  `.catch(() => []);

  if (Array.isArray(settings) && settings.length) {
    for (const row of settings) {
      await prisma.setting.upsert({
        where: { companyId_key: { companyId: company.id, key: row.key } },
        update: { value: row.value },
        create: { companyId: company.id, key: row.key, value: row.value },
      });
    }
  }

  const tables = [
    ['users', 'company_id'],
    ['leads', 'company_id'],
    ['campaigns', 'company_id'],
    ['call_logs', 'company_id'],
    ['webhook_logs', 'company_id'],
  ];

  for (const [table, col] of tables) {
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "${table}" SET "${col}" = $1 WHERE "${col}" IS NULL`,
        company.id
      );
      console.log(`Updated ${table}`);
    } catch (e) {
      console.warn(`Skip ${table}:`, e.message);
    }
  }

  console.log('Done. Default company GST for login:', DEFAULT_GSTIN);
  console.log('Ask users to sign in with this GST until you register proper companies.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
