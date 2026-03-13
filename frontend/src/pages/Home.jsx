import React, { useMemo } from 'react';
import { ShieldCheck, Bolt, Globe, BarChart, Lock, Users, Zap, ArrowRight, CreditCard, TrendingUp } from 'lucide-react';
import PricingSection from './home-sections/PricingSection';
import './Home.css';

const Home = () => {

  const features = useMemo(() => [
    {
      icon: ShieldCheck,
      title: 'Bank-Level Security',
      description: 'Advanced encryption and fraud detection to keep your transactions safe and secure.',
      color: '#EA580C'
    },
    {
      icon: Bolt,
      title: 'Lightning Fast',
      description: 'Process payments in milliseconds with our optimized infrastructure.',
      color: '#F97316'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Accept payments from 180+ countries in 135+ currencies.',
      color: '#FB923C'
    },
    {
      icon: BarChart,
      title: 'Real-time Analytics',
      description: 'Track performance with detailed insights and reporting tools.',
      color: '#EA580C'
    },
    {
      icon: Lock,
      title: 'PCI Compliant',
      description: 'Fully certified and compliant with industry security standards.',
      color: '#F97316'
    },
    {
      icon: Users,
      title: '24/7 Support',
      description: 'Expert support team available around the clock to help you succeed.',
      color: '#536878'
    }
  ], []);

  const stats = useMemo(() => [
    { value: '99.9%', label: 'Uptime' },
    { value: '50M+', label: 'Transactions' },
    { value: '180+', label: 'Countries' },
    { value: '<100ms', label: 'Response Time' }
  ], []);

  const testimonials = [
    {
      quote: "Best payment solution we've used. The analytics dashboard gives us insights we never had before.",
      author: "Divine Kelechi",
      role: "Sponsor, SportyBet",
      avatar: "https://i.pravatar.cc/100?u=michael"
    },
    {
      quote: "Security and speed combined perfectly. Our customers love the checkout experience.",
      author: "Abdulmahleeque Shitu",
      role: "CEO, Manager of Forex",
      avatar: "https://i.pravatar.cc/100?u=emily"
    },
     
    {
      quote: "Security and speed combined perfectly. Our customers love the checkout experience.",
      author: "Emmanuel James",
      role: "CTO, Administrator",
      avatar: "https://i.pravatar.cc/100?u=sarah"
    },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <Zap size={16} />
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
                  <ArrowRight size={20} />
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
                  <CreditCard size={24} className="card-icon" />
                  <span>Payment Dashboard</span>
                </div>
                <div className="card-body">
                  <div className="metric">
                    <span className="metric-label">Today's Revenue</span>
                    <span className="metric-value">₦2,000,000</span>
                    <span className="metric-change positive">
                      <TrendingUp size={16} />
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

      {/* Features Section */}
      <section className="features-section section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-badge">
              <Zap size={16} />
              <span>Why Choose Sompay?</span>
            </div>
            <h2 className="section-title">Everything you need to accept payments and grow your business</h2>
            <p className="section-description">
              Enterprise-grade security, lightning-fast processing, and powerful analytics in one platform
            </p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card card">
                <div className="feature-icon" style={{ color: feature.color }}>
                  <feature.icon size={32} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header text-center">
            <h2>Trusted by Industry Leaders</h2>
            <p className="lead">See what our customers have to say</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card card">
                <div className="testimonial-quote">"{testimonial.quote}"</div>
                <div className="testimonial-author">
                  <img src={testimonial.avatar} alt={testimonial.author} className="author-avatar" />
                  <div>
                    <div className="author-name">{testimonial.author}</div>
                    <div className="author-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      {/* CTA Section */}
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
                <ArrowRight size={20} />
              </a>
              <a href="/contact" className="btn-secondary-hero">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
