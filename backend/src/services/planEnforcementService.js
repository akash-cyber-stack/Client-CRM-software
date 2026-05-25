import prisma from '../config/db.js';
import { getPlanLimits } from '../constants/planLimits.js';

export async function getCompanyPlan(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { plan: true },
  });
  return company?.plan || 'STARTER';
}

export async function countCompanyUsers(companyId) {
  return prisma.user.count({ where: { companyId } });
}

export async function countCompanyLeads(companyId) {
  return prisma.lead.count({ where: { companyId } });
}

/** @returns {{ ok: boolean, remaining: number, current: number, max: number|null, plan: string }} */
export async function checkUserSeatAvailability(companyId, planId, additional = 1) {
  const plan = planId || (await getCompanyPlan(companyId));
  const limits = getPlanLimits(plan);
  const current = await countCompanyUsers(companyId);

  if (limits.maxUsers == null) {
    return { ok: true, remaining: Infinity, current, max: null, plan };
  }

  const remaining = Math.max(0, limits.maxUsers - current);
  return {
    ok: additional <= remaining,
    remaining,
    current,
    max: limits.maxUsers,
    plan,
  };
}

export async function checkLeadCapacity(companyId, planId, additional = 1) {
  const plan = planId || (await getCompanyPlan(companyId));
  const limits = getPlanLimits(plan);
  const current = await countCompanyLeads(companyId);

  if (limits.maxLeads == null) {
    return { ok: true, remaining: Infinity, current, max: null, plan };
  }

  const remaining = Math.max(0, limits.maxLeads - current);
  return {
    ok: additional <= remaining,
    remaining,
    current,
    max: limits.maxLeads,
    plan,
  };
}
