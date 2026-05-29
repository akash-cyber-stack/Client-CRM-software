const PLAN_FEATURES = {
  STARTER: ['dashboard', 'leads', 'follow-ups', 'settings', 'employees'],
  PROFESSIONAL: [
    'dashboard',
    'leads',
    'follow-ups',
    'employees',
    'calls',
    'reports',
    'settings',
    'emailAlerts',
  ],
  ENTERPRISE: [
    'dashboard',
    'leads',
    'follow-ups',
    'employees',
    'calls',
    'reports',
    'settings',
    'emailAlerts',
  ],
};

export function planHasEmailAlerts(planId) {
  return planId === 'PROFESSIONAL' || planId === 'ENTERPRISE';
}

export function getPlanFeatures(planId) {
  return PLAN_FEATURES[planId] || PLAN_FEATURES.STARTER;
}

export function canAccessFeature(planId, feature) {
  return getPlanFeatures(planId).includes(feature);
}
