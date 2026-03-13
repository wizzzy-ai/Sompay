import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { fetchPricingPlans } from '../../api/pricingPlans';

// Lazy load icons
const Award = React.lazy(() => import('lucide-react').then(module => ({ default: module.Award })));
const CheckCircle = React.lazy(() => import('lucide-react').then(module => ({ default: module.CheckCircle })));

const PricingSection = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError('');
        setLoading(true);
        const result = await fetchPricingPlans();
        if (!mounted) return;
        setPlans(Array.isArray(result) ? result : []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.error || 'Unable to load pricing plans');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const pricingPlans = useMemo(() => {
    return plans.map((plan) => {
      const isCustom = plan.priceType === 'custom';
      const displayAmount =
        plan.priceLabel ??
        (typeof plan.priceAmount === 'number' ? plan.priceAmount.toLocaleString() : '');
      const period =
        plan.periodLabel ??
        (!isCustom && plan.interval && plan.interval !== 'none' ? `/${plan.interval}` : '');

      return {
        key: plan.key || plan._id,
        name: plan.name,
        isCustom,
        currencySymbol: plan.currencySymbol || '$',
        amount: displayAmount,
        period,
        description: plan.description,
        features: plan.features || [],
        highlighted: !!plan.highlighted,
        badgeText: plan.badgeText,
        ctaText: plan.ctaText || 'Get Started',
        ctaHref: plan.ctaHref || '/register',
      };
    });
  }, [plans]);

  return (
    <section className="pricing-section section">
      <div className="container">
        <div className="section-header text-center">
          <div className="section-badge">
            <Suspense fallback={<div>Loading...</div>}>
              <Award size={16} />
            </Suspense>
            <span>Simple, Transparent Pricing</span>
          </div>
          <h2 className="section-title">Choose the plan that fits your business needs</h2>
          <p className="section-description">
            No hidden fees, no surprises. Start free and scale as you grow
          </p>
        </div>

        <div className="pricing-grid">
          {loading && <div className="card" style={{ padding: '1.5rem' }}>Loading plans…</div>}
          {!loading && error && <div className="card" style={{ padding: '1.5rem' }}>{error}</div>}
          {!loading && !error && pricingPlans.map((plan) => (
            <div key={plan.key} className={`pricing-card card ${plan.highlighted ? 'highlighted' : ''}`}>
              {(plan.badgeText || plan.highlighted) && (
                <div className="pricing-badge">
                  <Suspense fallback={<div>Loading...</div>}>
                    <Award size={16} />
                  </Suspense>
                  {plan.badgeText || 'Most Popular'}
                </div>
              )}
              <h3 className="pricing-name">{plan.name}</h3>
              <div className="pricing-price">
                {!plan.isCustom && <span className="currency">{plan.currencySymbol}</span>}
                <span className="amount">{plan.amount}</span>
                {!plan.isCustom && plan.period && <span className="period">{plan.period}</span>}
              </div>
              <p className="pricing-description">{plan.description}</p>
              <ul className="pricing-features">
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    <Suspense fallback={<div>Loading...</div>}>
                      <CheckCircle size={18} />
                    </Suspense>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href={plan.ctaHref}
                className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'} w-100`}
              >
                {plan.ctaText}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
