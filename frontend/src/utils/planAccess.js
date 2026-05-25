const PLAN_FEATURES = {
  STARTER: ['dashboard', 'leads', 'follow-ups', 'settings', 'employees'],
  PROFESSIONAL: ['dashboard', 'leads', 'follow-ups', 'employees', 'calls', 'reports', 'settings'],
  ENTERPRISE: ['dashboard', 'leads', 'follow-ups', 'employees', 'calls', 'reports', 'settings'],
};

export function getPlanFeatures(planId) {
  return PLAN_FEATURES[planId] || PLAN_FEATURES.STARTER;
}

export function canAccessFeature(planId, feature) {
  return getPlanFeatures(planId).includes(feature);
}
