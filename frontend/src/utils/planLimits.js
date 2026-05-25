export const PLAN_LIMITS = {
  STARTER: { maxUsers: 5, maxLeads: 500 },
  PROFESSIONAL: { maxUsers: 25, maxLeads: null },
  ENTERPRISE: { maxUsers: null, maxLeads: null },
};

export function getPlanLimits(planId) {
  return PLAN_LIMITS[planId] || PLAN_LIMITS.STARTER;
}

export function planUserLimitLabel(planId) {
  const limits = getPlanLimits(planId);
  if (limits.maxUsers == null) return null;
  const name =
    planId === 'STARTER' ? 'Starter' : planId === 'PROFESSIONAL' ? 'Professional' : 'Your';
  return `${name} plan allows up to ${limits.maxUsers} users (including Super Admin). Upgrade to add more.`;
}

export function remainingUserSlots(planId, currentCount) {
  const limits = getPlanLimits(planId);
  if (limits.maxUsers == null) return Infinity;
  return Math.max(0, limits.maxUsers - currentCount);
}
