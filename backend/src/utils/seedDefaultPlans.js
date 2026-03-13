import PricingPlan from '../models/PricingPlan.js';

const shouldSeed = () => {
  const explicit = String(process.env.SEED_DEFAULT_PLANS || '').toLowerCase();
  if (explicit === 'true' || explicit === '1' || explicit === 'yes') return true;
  if (explicit === 'false' || explicit === '0' || explicit === 'no') return false;
  return process.env.NODE_ENV !== 'production';
};

export const seedDefaultPlans = async (logger = console) => {
  if (!shouldSeed()) return;

  const existingCount = await PricingPlan.countDocuments({});
  if (existingCount > 0) return;

  const defaults = [
    {
      key: 'starter',
      name: 'Starter',
      priceType: 'free',
      priceAmount: 0,
      priceLabel: '0',
      currencySymbol: '$',
      interval: 'month',
      periodLabel: '/month',
      description: 'Perfect for small businesses',
      features: ['Up to 100 transactions/month', 'Basic analytics', 'Email support', 'Standard security'],
      highlighted: false,
      badgeText: null,
      sortOrder: 1,
      ctaText: 'Get Started',
      ctaHref: '/register',
      isActive: true,
    },
    {
      key: 'professional',
      name: 'Professional',
      priceType: 'fixed',
      priceAmount: 29999,
      priceLabel: '29,999',
      currencySymbol: '$',
      interval: 'month',
      periodLabel: '/month',
      description: 'For growing businesses',
      features: [
        'Unlimited transactions',
        'Advanced analytics',
        'Priority support',
        'Enhanced security',
        'Custom branding',
        'API access',
      ],
      highlighted: true,
      badgeText: 'Most Popular',
      savingsText: null,
      sortOrder: 2,
      ctaText: 'Get Started',
      ctaHref: '/register',
      isActive: true,
    },
    {
      key: 'enterprise',
      name: 'Enterprise',
      priceType: 'custom',
      priceAmount: null,
      priceLabel: 'Custom',
      currencySymbol: '$',
      interval: 'none',
      periodLabel: null,
      description: 'For large organizations',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom integrations',
        'SLA guarantee',
        'White-label solution',
      ],
      highlighted: false,
      badgeText: null,
      sortOrder: 3,
      ctaText: 'Contact Sales',
      ctaHref: '/contact',
      isActive: true,
    },
  ];

  await PricingPlan.insertMany(defaults);
  logger.info?.(`[seedDefaultPlans] Created ${defaults.length} pricing plans`);
};

