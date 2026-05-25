export const PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 999,
    priceLabel: '₹999',
    period: '/month',
    description: 'Small teams getting started',
    features: ['Up to 5 users', '500 leads', 'Email support', 'Basic reports'],
    popular: false,
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: 2499,
    priceLabel: '₹2,499',
    period: '/month',
    description: 'Growing sales teams',
    features: ['Up to 25 users', 'Unlimited leads', 'IVR integration', 'Automation alerts'],
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 4999,
    priceLabel: '₹4,999',
    period: '/month',
    description: 'Full-scale operations',
    features: ['Unlimited users', 'Priority support', 'Custom webhooks', 'Advanced analytics'],
    popular: false,
  },
];

export function getPlan(planId) {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
}
