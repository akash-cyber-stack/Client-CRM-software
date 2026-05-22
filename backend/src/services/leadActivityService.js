import prisma from '../config/db.js';

export async function logActivity(leadId, type, description, metadata = null) {
  return prisma.leadActivity.create({
    data: { leadId, type, description, metadata },
  });
}

export async function getLeadTimeline(leadId) {
  return prisma.leadActivity.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
  });
}
