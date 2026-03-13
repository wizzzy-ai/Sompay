import PricingPlan from '../models/PricingPlan.js';

export const getPricingPlans = async (req, res) => {
  try {
    const plans = await PricingPlan.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select(
        'key name priceType priceAmount priceLabel currencyCode currencySymbol interval periodLabel description features highlighted badgeText savingsText ctaText ctaHref sortOrder'
      )
      .lean();

    res.json({ plans });
  } catch {
    res.status(500).json({ error: 'Failed to load pricing plans' });
  }
};

