export const PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 1299,
    priceLabel: '₹1,299',
    period: '/month',
    description: 'Small teams getting started',
    features: ['Up to 5 users', '500 leads', 'Email support', 'Basic reports', 'In-app alerts only'],
    popular: false,
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: 3299,
    priceLabel: '₹3,299',
    period: '/month',
    description: 'Growing sales teams',
    features: [
      'Up to 25 users',
      'Unlimited leads',
      'IVR integration',
      'Automation alerts',
      'Email alerts (leads, notices & reports)',
    ],
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 5999,
    priceLabel: '₹5,999',
    period: '/month',
    description: 'Full-scale operations with AI-led control',
    features: [
      'Unlimited users',
      'Email alerts (leads, notices & reports)',
      'Priority support',
      'AI root-cause analysis',
      'Predictive follow-up engine',
      'Smart campaign optimization',
      'Dedicated success manager',
      'Custom webhooks',
      'Advanced analytics',
    ],
    popular: false,
  },
];

export function getPlan(planId) {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
}
