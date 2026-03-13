import React, { useMemo } from 'react';
import { ShieldCheck, Bolt, Globe, BarChart, Lock, Users, Zap } from 'lucide-react';

const FeaturesSection = () => {
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

  return (
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
  );
};

export default FeaturesSection;
