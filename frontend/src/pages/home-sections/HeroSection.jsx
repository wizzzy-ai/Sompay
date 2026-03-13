import React, { Suspense } from 'react';

// Lazy load icons
const Zap = React.lazy(() => import('lucide-react').then(module => ({ default: module.Zap })));
const ArrowRight = React.lazy(() => import('lucide-react').then(module => ({ default: module.ArrowRight })));
const CreditCard = React.lazy(() => import('lucide-react').then(module => ({ default: module.CreditCard })));
const TrendingUp = React.lazy(() => import('lucide-react').then(module => ({ default: module.TrendingUp })));

const HeroSection = () => {
  const stats = [
    { value: '99.9%', label: 'Uptime' },
    { value: '50M+', label: 'Transactions' },
    { value: '180+', label: 'Countries' },
    { value: '<100ms', label: 'Response Time' }
  ];

  return (
    <section className="hero-section">
      <div className="hero-background">
        <div className="hero-gradient"></div>
        <div className="hero-pattern"></div>
      </div>

      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <Suspense fallback={<div>Loading...</div>}>
                <Zap size={16} />
              </Suspense>
              <span>Trusted by 10,000+ businesses worldwide</span>
            </div>

            <h1 className="hero-title">
              Payment Solutions
              <span className="text-gradient"> Built for Growth</span>
            </h1>

            <p className="hero-description">
              Accept payments globally with enterprise-grade security, lightning-fast processing,
              and powerful analytics. Scale your business with confidence.
            </p>

            <div className="hero-cta">
              <a href="/register" className="btn-hero">
                Start Free Trial
                <Suspense fallback={<div>Loading...</div>}>
                  <ArrowRight size={20} />
                </Suspense>
              </a>
              <a href="/contact" className="btn-secondary-hero">
                Schedule Demo
              </a>
            </div>

            <div className="hero-stats">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card card-glass">
              <div className="card-header">
                <Suspense fallback={<div>Loading...</div>}>
                  <CreditCard size={24} className="card-icon" />
                </Suspense>
                <span>Payment Dashboard</span>
              </div>
              <div className="card-body">
                <div className="metric">
                  <span className="metric-label">Today's Revenue</span>
                  <span className="metric-value">₦2,000,000</span>
                  <span className="metric-change positive">
                    <Suspense fallback={<div>Loading...</div>}>
                      <TrendingUp size={16} />
                    </Suspense>
                    +12.5%
                  </span>
                </div>
                <div className="chart-placeholder">
                  <div className="chart-bar" style={{ height: '40%' }}></div>
                  <div className="chart-bar" style={{ height: '65%' }}></div>
                  <div className="chart-bar" style={{ height: '45%' }}></div>
                  <div className="chart-bar" style={{ height: '80%' }}></div>
                  <div className="chart-bar" style={{ height: '60%' }}></div>
                  <div className="chart-bar" style={{ height: '90%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
