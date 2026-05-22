import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Seed only system settings — no demo users, leads, or calls */
async function main() {
  console.log('Seeding default settings only (no demo data)...');

  await prisma.leadAssignmentState.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });

  const settings = [
    ['google_webhook_secret', ''],
    ['meta_webhook_token', ''],
    ['meta_webhook_secret', ''],
    ['ivr_api_key', ''],
    ['ivr_api_url', ''],
    ['ivr_webhook_secret', ''],
    ['lead_assignment_method', 'ROUND_ROBIN'],
    ['api_base_url', 'http://localhost:5000'],
    ['automation_missed_followup', 'true'],
    ['automation_followup_reminder', 'true'],
    ['automation_stale_lead_enabled', 'true'],
    ['automation_stale_lead_days', '3'],
    ['automation_unassigned_lead_alert', 'true'],
    ['automation_auto_assign_webhook', 'true'],
  ];

  for (const [key, value] of settings) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  console.log('Done. Register Super Admin from login page (first time only).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
