import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const companies = await prisma.company.findMany({
  select: {
    id: true,
    name: true,
    gstin: true,
    _count: { select: { leads: true, users: true } },
  },
});

console.log('=== COMPANIES ===');
console.table(companies);

const leads = await prisma.lead.findMany({
  take: 5,
  select: {
    leadNumber: true,
    customerName: true,
    companyId: true,
    company: { select: { name: true, gstin: true } },
  },
  orderBy: { leadNumber: 'desc' },
});

console.log('\n=== SAMPLE LEADS (company_id column) ===');
console.table(
  leads.map((l) => ({
    lead_number: l.leadNumber,
    customer: l.customerName,
    company: l.company?.name,
    gstin: l.company?.gstin,
    company_id: l.companyId?.slice(0, 8) + '…',
  }))
);

await prisma.$disconnect();
