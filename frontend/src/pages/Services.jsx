// eslint-disable-next-line no-unused-vars
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Users,
  BarChart,
  Shield,
  Zap,
  Globe,
  MessageSquare,
  Clock,
  CheckCircle,
  TrendingUp,
  Lock,
  Smartphone,
  ArrowRight,
  Star,
  Sparkles,
} from 'lucide-react';
import { fetchPricingPlans } from '../api/pricingPlans';
import './Services.css';

const Services = () => {
  const mainServices = [
    {
      icon: CreditCard,
      title: 'Payment Processing',
      description: 'Accept payments from multiple channels with our secure and reliable payment gateway.',
      features: ['Multiple payment methods', 'Instant settlements', 'Fraud protection', 'Real-time reporting'],
      color: 'primary',
      gradient: 'from-blue-500 to-purple-600',
      stats: '99.9% Uptime',
    },
    {
      icon: Users,
      title: 'Client Management',
      description: 'Comprehensive tools to manage your client relationships and track payment history.',
      features: ['Client profiles', 'Payment tracking', 'Automated billing', 'Custom reports'],
      color: 'success',
      gradient: 'from-green-500 to-teal-600',
      stats: '10K+ Clients',
    },
    {
      icon: BarChart,
      title: 'Analytics & Insights',
      description: 'Powerful analytics to help you understand your business performance and make data-driven decisions.',
      features: ['Revenue analytics', 'Payment trends', 'Customer insights', 'Export reports'],
      color: 'info',
      gradient: 'from-cyan-500 to-blue-600',
      stats: 'Real-time Data',
    },
    {
      icon: MessageSquare,
      title: 'Secure Messaging',
      description: 'Communicate securely with your clients through our encrypted messaging platform.',
      features: ['End-to-end encryption', 'File sharing', 'Real-time notifications', 'Message history'],
      color: 'warning',
      gradient: 'from-orange-500 to-red-600',
      stats: 'Bank-level Security',
    },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Your data is protected with enterprise-grade encryption and security protocols.',
      metric: '256-bit',
      color: 'blue',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process transactions in seconds with our optimized infrastructure.',
      metric: '<2s',
      color: 'yellow',
    },
    {
      icon: Globe,
      title: 'Multi-Currency',
      description: 'Accept payments in multiple currencies and expand your business globally.',
      metric: '150+',
      color: 'green',
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Our dedicated support team is always available to help you succeed.',
      metric: '24/7',
      color: 'purple',
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Manage your business on the go with our mobile-optimized platform.',
      metric: '100%',
      color: 'pink',
    },
    {
      icon: Lock,
      title: 'Compliance',
      description: 'Fully compliant with PCI DSS and local regulatory requirements.',
      metric: 'PCI DSS',
      color: 'indigo',
    },
  ];

  const [planDocs, setPlanDocs] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');

	  useEffect(() => {
	    let mounted = true;
	    (async () => {
	      try {
	        setPlansError('');
	        setPlansLoading(true);
	        const result = await fetchPricingPlans();
	        if (!mounted) return;
	        setPlanDocs(Array.isArray(result) ? result : []);
	      } catch (e) {
	        if (!mounted) return;
	        setPlansError(e?.response?.data?.error || 'Unable to load pricing plans');
	      } finally {
	        if (!mounted) return;
	        setPlansLoading(false);
	      }
	    })();
	    return () => {
	      mounted = false;
	    };
	  }, []);

  const pricingPlans = useMemo(() => {
    return planDocs.map((plan) => {
      const isCustom = plan.priceType === 'custom';
      const isFree = plan.priceType === 'free' || plan.priceAmount === 0;
      const displayAmount =
        plan.priceLabel ??
        (typeof plan.priceAmount === 'number' ? plan.priceAmount.toLocaleString() : '');

      const period =
        plan.periodLabel ??
        (isCustom ? 'Contact us' : isFree ? 'Free Forever' : plan.interval ? `per ${plan.interval}` : 'per month');

      return {
        key: plan.key || plan._id,
        name: plan.name,
        price: isCustom ? plan.priceLabel || 'Custom' : displayAmount,
        isCustom,
        currencySymbol: plan.currencySymbol || '₦',
        period,
        description: plan.description,
        features: plan.features || [],
        highlighted: !!plan.highlighted,
        badge: plan.badgeText || (plan.highlighted ? 'Best Value' : plan.name),
        savings: plan.savingsText || null,
        ctaText: plan.ctaText || (isCustom ? 'Contact Sales' : 'Get Started'),
        ctaHref: plan.ctaHref || (isCustom ? '/contact' : '/register'),
      };
    });
  }, [planDocs]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="services-container">
      {/* Animated Background Elements */}
      <div className="floating-elements">
        <div className="floating-element floating-element-1"></div>
        <div className="floating-element floating-element-2"></div>
        <div className="floating-element floating-element-3"></div>
      </div>

      {/* Hero Section */}
      <div className="services-hero">
        <div className="hero-grid-pattern"></div>
        <div className="container">
          <div className="services-hero-inner">
            <motion.div
              className="hero-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div 
                className="hero-badge"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Sparkles size={16} className="me-2" />
                Next-Generation Payment Solutions
              </motion.div>
              
              <h1 className="hero-title">
                Powerful Solutions for{' '}
                <span className="hero-gradient-text">
                  Modern Businesses
                  <motion.div 
                    className="text-underline"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  ></motion.div>
                </span>
              </h1>
              
              <p className="hero-subtitle">
                Everything you need to manage payments, clients, and grow your business in one powerful platform
                designed for speed, security, and clarity.
              </p>
              
              <div className="hero-cta-group">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link className="btn-futuristic btn-primary" to="/register">
                    <span>Get Started Free</span>
                    <ArrowRight size={18} className="btn-icon" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link className="btn-futuristic btn-secondary" to="/contact">
                    <span>Schedule Demo</span>
                  </Link>
                </motion.div>
              </div>

              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Active Users</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <div className="stat-number">₦2B+</div>
                  <div className="stat-label">Processed</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <div className="stat-number">99.9%</div>
                  <div className="stat-label">Uptime</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="hero-right"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
            >
              <div className="hero-preview">
                <div className="hero-preview-header">
                  <div className="hero-preview-title">Live Overview</div>
                  <div className="hero-preview-pill">Secure • Real-time</div>
                </div>

                <div className="hero-preview-metrics">
                  <div className="hero-metric">
                    <div className="hero-metric-label">Today</div>
                    <div className="hero-metric-value">₦12.4M</div>
                  </div>
                  <div className="hero-metric">
                    <div className="hero-metric-label">Success Rate</div>
                    <div className="hero-metric-value">99.2%</div>
                  </div>
                </div>

                <div className="hero-preview-cards">
                  <div className="hero-mini-card">
                    <CreditCard size={18} />
                    <div>
                      <div className="hero-mini-title">Payments</div>
                      <div className="hero-mini-sub">Multiple channels</div>
                    </div>
                  </div>
                  <div className="hero-mini-card">
                    <Users size={18} />
                    <div>
                      <div className="hero-mini-title">Clients</div>
                      <div className="hero-mini-sub">Profiles & billing</div>
                    </div>
                  </div>
                  <div className="hero-mini-card">
                    <BarChart size={18} />
                    <div>
                      <div className="hero-mini-title">Analytics</div>
                      <div className="hero-mini-sub">Real-time insights</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Services */}
      <div className="section services-section">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="section-badge">
              <Star size={16} className="me-2" />
              Core Services
            </div>
            <h2 className="section-title">
              Comprehensive Solutions
              <span className="title-accent"> Built for Scale</span>
            </h2>
            <p className="section-subtitle">
              Powerful tools designed to transform how you handle payments and manage client relationships
            </p>
          </motion.div>

          <motion.div 
            className="row g-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {mainServices.map((service, index) => (
              <div key={index} className="col-lg-6">
                <motion.div
                  className="service-card-modern"
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="service-card-glow"></div>
                  <div className="service-header">
                    <div className={`service-icon-modern service-icon-${service.color}`}>
                      <service.icon size={28} />
                      <div className="icon-pulse"></div>
                    </div>
                    <div className="service-stats">{service.stats}</div>
                  </div>
                  
                  <div className="service-content">
                    <h3 className="service-title">{service.title}</h3>
                    <p className="service-description">{service.description}</p>
                    
                    <ul className="service-features-modern">
                      {service.features.map((feature, idx) => (
                        <li key={idx}>
                          <CheckCircle size={16} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

	                  <div className="service-footer">
	                    <Link className="service-cta" to="/contact">
	                      Learn More
	                      <ArrowRight size={16} />
	                    </Link>
	                  </div>
	                </motion.div>
	              </div>
	            ))}
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="section features-section">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="section-badge">
              <Shield size={16} className="me-2" />
              Why Choose Sompay
            </div>
            <h2 className="section-title">
              Built with the Features
              <span className="title-accent"> You Need to Succeed</span>
            </h2>
          </motion.div>

          <motion.div 
            className="row g-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <div key={index} className="col-lg-4 col-md-6">
                <motion.div
                  className={`feature-card-modern feature-${feature.color}`}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="feature-metric">{feature.metric}</div>
                  <div className="feature-icon-container">
                    <feature.icon size={32} className="feature-icon" />
                    <div className="feature-icon-bg"></div>
                  </div>
                  <h4 className="feature-title">{feature.title}</h4>
                  <p className="feature-description">{feature.description}</p>
                  <div className="feature-progress">
                    <div className="progress-bar"></div>
                  </div>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="section pricing-section">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="section-badge">
              <TrendingUp size={16} className="me-2" />
              Pricing Plans
            </div>
            <h2 className="section-title">
              Simple, Transparent
              <span className="title-accent"> Pricing</span>
            </h2>
            <p className="section-subtitle">
              Choose the plan that's right for your business with no hidden fees
            </p>
          </motion.div>

          <motion.div 
            className="row g-4 justify-content-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
	            {plansLoading && (
	              <div className="col-lg-4">
	                <div className="pricing-card-modern" style={{ padding: '1.5rem' }}>Loading plans…</div>
	              </div>
	            )}
	            {!plansLoading && plansError && (
	              <div className="col-lg-6">
	                <div className="pricing-card-modern" style={{ padding: '1.5rem' }}>{plansError}</div>
	              </div>
	            )}
	            {!plansLoading && !plansError && pricingPlans.map((plan) => (
	              <div key={plan.key} className="col-lg-4">
                <motion.div
                  className={`pricing-card-modern ${plan.highlighted ? 'pricing-featured' : ''}`}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {plan.highlighted && <div className="pricing-glow"></div>}
                  
                  <div className="pricing-badge">{plan.badge}</div>
                  {plan.savings && <div className="pricing-savings">{plan.savings}</div>}
                  
                  <div className="pricing-header-modern">
                    <h3 className="pricing-name">{plan.name}</h3>
                    <div className="pricing-price-container">
	                      {plan.isCustom ? (
	                        <div className="pricing-price-custom">{plan.price}</div>
                      ) : (
                        <>
	                          <span className="pricing-currency">{plan.currencySymbol}</span>
                          <span className="pricing-price">{plan.price}</span>
                        </>
                      )}
                    </div>
                    <div className="pricing-period">{plan.period}</div>
                    <p className="pricing-description">{plan.description}</p>
                  </div>

                  <ul className="pricing-features-modern">
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>
                        <CheckCircle size={16} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

	                  <motion.button 
	                    className={`pricing-cta ${plan.highlighted ? 'pricing-cta-primary' : 'pricing-cta-secondary'}`}
	                    whileHover={{ scale: 1.02 }}
	                    whileTap={{ scale: 0.98 }}
	                    onClick={() => { window.location.href = plan.ctaHref; }}
	                  >
	                    <span>{plan.ctaText}</span>
	                    <ArrowRight size={16} />
	                  </motion.button>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="section cta-section">
        <div className="container">
          <motion.div
            className="cta-card-modern"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="cta-background-pattern"></div>
            <div className="cta-content">
              <div className="cta-icon-container">
                <TrendingUp size={48} />
                <div className="cta-icon-glow"></div>
              </div>
              <h2 className="cta-title">Ready to Transform Your Business?</h2>
              <p className="cta-subtitle">
                Join thousands of businesses already using Sompay to streamline 
                their payment operations and accelerate growth.
              </p>
              <div className="cta-buttons">
                <motion.button 
                  className="btn-futuristic btn-light"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Start Free Trial</span>
                  <ArrowRight size={18} className="btn-icon" />
                </motion.button>
                <motion.button 
                  className="btn-futuristic btn-outline-light"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Contact Sales</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Services;
