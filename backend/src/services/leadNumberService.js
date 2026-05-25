import prisma from '../config/db.js';

export async function getMaxLeadNumber(companyId) {
  const agg = await prisma.lead.aggregate({
    where: { companyId },
    _max: { leadNumber: true },
  });
  return agg._max.leadNumber ?? 0;
}

export async function getNextLeadNumber(companyId) {
  return (await getMaxLeadNumber(companyId)) + 1;
}

/** Reserve consecutive SNO values for bulk insert (per company). */
export async function reserveLeadNumbers(companyId, count) {
  const start = (await getMaxLeadNumber(companyId)) + 1;
  return Array.from({ length: count }, (_, i) => start + i);
}

/** Renumber all leads in a company 1…N by createdAt (fixes legacy global autoincrement). */
export async function renumberCompanyLeads(companyId) {
  const leads = await prisma.lead.findMany({
    where: { companyId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });

  if (!leads.length) return 0;

  const CHUNK = 100;
  for (let i = 0; i < leads.length; i += CHUNK) {
    const slice = leads.slice(i, i + CHUNK);
    await prisma.$transaction(
      slice.map((lead, idx) =>
        prisma.lead.update({
          where: { id: lead.id },
          data: { leadNumber: i + idx + 1 },
        })
      )
    );
  }
  return leads.length;
}
