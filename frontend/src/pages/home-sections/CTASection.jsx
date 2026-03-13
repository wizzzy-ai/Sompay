import React, { Suspense } from 'react';

// Lazy load icons
const ArrowRight = React.lazy(() => import('lucide-react').then(module => ({ default: module.ArrowRight })));

const CTASection = () => {
  return (
    <section className="cta-section">
      <div className="cta-background">
        <div className="cta-gradient"></div>
      </div>
      <div className="container">
        <div className="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of businesses already using Sompay</p>
          <div className="cta-buttons">
            <a href="/register" className="btn-hero">
              Start Free Trial
              <Suspense fallback={<div>Loading...</div>}>
                <ArrowRight size={20} />
              </Suspense>
            </a>
            <a href="/contact" className="btn-secondary-hero">
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
