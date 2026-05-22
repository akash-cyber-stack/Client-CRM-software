import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Removing all CRM data (users, leads, calls, etc.)...');
  await prisma.notification.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.webhookLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.leadAssignmentState.updateMany({ data: { lastEmployeeId: null } });
  console.log('All data cleared. Run: npm run db:seed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
