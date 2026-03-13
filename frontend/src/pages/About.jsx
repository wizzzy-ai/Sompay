import { motion } from 'framer-motion';
import {
  Target,
  Users,
  Award,
  Lightbulb,
  Shield,
  TrendingUp,
  Globe,
  Heart,
  Zap,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import './About.css';

const About = () => {
  const values = [
    {
      icon: Shield,
      title: 'Security First',
      description: 'Bank-level encryption and security protocols to protect your data and transactions.',
      color: 'primary',
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Constantly evolving with cutting-edge technology to serve you better.',
      color: 'warning',
    },
    {
      icon: Heart,
      title: 'Customer Focus',
      description: 'Your success is our success. We\'re committed to exceptional service.',
      color: 'danger',
    },
    {
      icon: Zap,
      title: 'Speed & Efficiency',
      description: 'Lightning-fast transactions and streamlined processes for your convenience.',
      color: 'info',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Users', icon: Users },
    { value: '₦5B+', label: 'Processed', icon: TrendingUp },
    { value: '99.9%', label: 'Uptime', icon: CheckCircle },
    { value: '24/7', label: 'Support', icon: Globe },
  ];

  const timeline = [
    {
      year: '2020',
      title: 'Company Founded',
      description: 'Started with a vision to revolutionize payment processing in Nigeria.',
    },
    {
      year: '2021',
      title: 'First 1000 Users',
      description: 'Reached our first milestone and expanded our service offerings.',
    },
    {
      year: '2022',
      title: 'Series A Funding',
      description: 'Secured funding to scale operations and enhance our platform.',
    },
    {
      year: '2023',
      title: 'Regional Expansion',
      description: 'Expanded services across West Africa with new partnerships.',
    },
    {
      year: '2024',
      title: 'Industry Leader',
      description: 'Recognized as one of the top payment service providers in the region.',
    },
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'Chief Executive Officer',
      image: 'https://i.pravatar.cc/300?u=sarah',
      bio: 'Visionary leader with 15+ years in fintech',
    },
    {
      name: 'Michael Chen',
      role: 'Chief Technology Officer',
      image: 'https://i.pravatar.cc/300?u=michael',
      bio: 'Tech innovator passionate about secure payments',
    },
    {
      name: 'Amara Okafor',
      role: 'Head of Operations',
      image: 'https://i.pravatar.cc/300?u=amara',
      bio: 'Operations expert ensuring seamless service',
    },
    {
      name: 'David Martinez',
      role: 'Head of Customer Success',
      image: 'https://i.pravatar.cc/300?u=david',
      bio: 'Customer advocate dedicated to your success',
    },
  ];

  return (
    <div className="about-container">
      {/* Hero Section */}
      <div className="about-hero">
        <div className="about-hero-background"></div>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="display-3 fw-bold mb-4">
                  Empowering Businesses Through{' '}
                  <span className="text-gradient-primary">Seamless Payments</span>
                </h1>
                <p className="lead mb-4">
                  We're on a mission to make payment processing simple, secure, and accessible for every business in Africa.
                </p>
                <button className="btn btn-primary btn-lg me-3">
                  Get Started
                  <ArrowRight size={20} className="ms-2" />
                </button>
                <a href="/register" className="btn btn-outline-primary btn-lg ms-3">
                  Contact Us
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="section bg-white">
        <div className="container">
          <div className="row g-4">
            {stats.map((stat, index) => (
              <div key={index} className="col-lg-3 col-md-6">
                <motion.div
                  className="stat-card-about text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="icon-wrapper icon-wrapper-lg mx-auto mb-3">
                    <stat.icon size={32} />
                  </div>
                  <div className="stat-value-about">{stat.value}</div>
                  <div className="stat-label-about">{stat.label}</div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="icon-wrapper icon-wrapper-lg mb-4" style={{ background: 'var(--bg-gradient-primary)' }}>
                  <Target size={32} />
                </div>
                <h2 className="display-5 fw-bold mb-4">Our Mission</h2>
                <p className="lead mb-4">
                  To democratize access to world-class payment infrastructure, enabling businesses of all sizes to accept payments securely, efficiently, and affordably.
                </p>
                <p className="mb-4">
                  We believe that every business deserves access to the same powerful payment tools that large corporations use. That's why we've built a platform that combines enterprise-grade security with user-friendly design.
                </p>
                <ul className="feature-list">
                  <li>
                    <CheckCircle size={20} className="text-success me-2" />
                    Secure and reliable payment processing
                  </li>
                  <li>
                    <CheckCircle size={20} className="text-success me-2" />
                    Transparent pricing with no hidden fees
                  </li>
                  <li>
                    <CheckCircle size={20} className="text-success me-2" />
                    24/7 customer support and assistance
                  </li>
                  <li>
                    <CheckCircle size={20} className="text-success me-2" />
                    Continuous innovation and improvement
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="section bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="display-5 fw-bold mb-3">Our Core Values</h2>
              <p className="lead text-muted">
                The principles that guide everything we do
              </p>
            </motion.div>
          </div>

          <div className="row g-4">
            {values.map((value, index) => (
              <div key={index} className="col-lg-3 col-md-6">
                <motion.div
                  className="value-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`icon-wrapper icon-wrapper-lg mb-4`} style={{ background: `var(--color-${value.color})` }}>
                    <value.icon size={32} />
                  </div>
                  <h4 className="mb-3">{value.title}</h4>
                  <p className="text-muted mb-0">{value.description}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="section">
        <div className="container">
          <div className="text-center mb-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="display-5 fw-bold mb-3">Our Journey</h2>
              <p className="lead text-muted">
                Milestones that shaped our story
              </p>
            </motion.div>
          </div>

          <div className="timeline">
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                className="timeline-item"
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="timeline-content">
                  <div className="timeline-year">{item.year}</div>
                  <h4 className="timeline-title">{item.title}</h4>
                  <p className="timeline-description">{item.description}</p>
                </div>
                <div className="timeline-marker"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="section bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="display-5 fw-bold mb-3">Meet Our Team</h2>
              <p className="lead text-muted">
                The talented people behind Sompay
              </p>
            </motion.div>
          </div>

          <div className="row g-4">
            {team.map((member, index) => (
              <div key={index} className="col-lg-3 col-md-6">
                <motion.div
                  className="team-member-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="team-member-info">
                    <h4 className="team-member-name">{member.name}</h4>
                    <div className="team-member-role">{member.role}</div>
                    <p className="team-member-bio">{member.bio}</p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="section">
        <div className="container">
          <motion.div
            className="card card-gradient text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="card-body p-5">
              <Award size={48} className="mb-4" />
              <h2 className="display-6 fw-bold mb-3">Ready to Join Us?</h2>
              <p className="lead mb-4">
                Be part of the payment revolution. Start accepting payments today.
              </p>
              <button className="btn btn-light btn-lg me-3">
                Get Started Free
              </button>
              <button className="btn btn-outline-light btn-lg">
                Schedule a Demo
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;