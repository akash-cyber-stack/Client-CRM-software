/**
 * Adds ADMIN_NOTICE and REPORT_SHARED to NotificationType enum.
 * Run: node prisma/apply-notification-types-migration.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addEnumValue(value) {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TYPE "NotificationType" ADD VALUE '${value}'`
    );
    console.log(`Added NotificationType.${value}`);
  } catch (e) {
    if (String(e.message).includes('already exists')) {
      console.log(`NotificationType.${value} already exists`);
    } else {
      throw e;
    }
  }
}

async function main() {
  await addEnumValue('ADMIN_NOTICE');
  await addEnumValue('REPORT_SHARED');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
