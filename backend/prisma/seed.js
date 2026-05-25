import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Seed only system settings template — companies get settings on create */
async function main() {
  console.log('No global seed data. Register a company from the login page.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
