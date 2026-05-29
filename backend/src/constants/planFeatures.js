/** Plan-gated product features (not seat/lead caps). */
export function planHasEmailAlerts(planId) {
  return planId === 'PROFESSIONAL' || planId === 'ENTERPRISE';
}

export const EMAIL_ALERTS_PLAN_LABEL = 'Professional & Enterprise';
