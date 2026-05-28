/** Seat count includes Super Admin + all users in the company. */
export const PLAN_LIMITS = {
  STARTER: { maxUsers: 5, maxLeads: 500, maxManagers: 1 },
  PROFESSIONAL: { maxUsers: 25, maxLeads: null, maxManagers: 4 },
  ENTERPRISE: { maxUsers: null, maxLeads: null, maxManagers: null },
};

export function getPlanLimits(planId) {
  return PLAN_LIMITS[planId] || PLAN_LIMITS.STARTER;
}

export function planLimitMessage(planId, type = 'users') {
  const limits = getPlanLimits(planId);
  const planName =
    planId === 'STARTER' ? 'Starter' : planId === 'PROFESSIONAL' ? 'Professional' : 'Your';

  if (type === 'users') {
    if (limits.maxUsers == null) return null;
    return `${planName} plan allows up to ${limits.maxUsers} users (including Super Admin). Upgrade to add more.`;
  }
  if (type === 'managers') {
    if (limits.maxManagers == null) return null;
    return `${planName} plan allows up to ${limits.maxManagers} managers. Upgrade to add more managers.`;
  }

  if (limits.maxLeads == null) return null;
  return `${planName} plan allows up to ${limits.maxLeads} leads. Upgrade to add more.`;
}
