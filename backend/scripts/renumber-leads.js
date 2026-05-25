/**
 * One-time: per-company SNO 1…N by createdAt.
 * Run: node backend/scripts/renumber-leads.js
 */
import prisma from '../src/config/db.js';
import { renumberCompanyLeads } from '../src/services/leadNumberService.js';

const companies = await prisma.company.findMany({ select: { id: true, name: true } });

for (const c of companies) {
  const n = await renumberCompanyLeads(c.id);
  console.log(`${c.name}: renumbered ${n} leads`);
}

await prisma.$disconnect();
