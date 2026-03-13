import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Settings,
  Shield,
  ChevronRight,
  ArrowUpRight,
  Activity,
  Zap,
  Globe,
  Lock,
  BarChart3,
  Wallet,
  Send,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  CalendarDays,
  BadgeCheck
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPayments: 0,
    pendingPayments: 0,
    activeClients: 0
  });
  const [payments, setPayments] = useState([]);
  const [monthlyDue, setMonthlyDue] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    hasDue: false,
    dueAmount: null,
    outstanding: null,
    baseDueAmount: null,
    extraChargeTotal: 0,
    notes: null,
    paymentStatus: 'unpaid',
    paidAmount: null,
    paidAt: null,
    totalOutstanding: 0,
    pendingMonths: 0,
    missedMonths: 0,
    nextPendingDue: null,
    latestPaidItem: null,
    dueItems: []
  });
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const normalizePayments = (raw) => {
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.payments)
        ? raw.payments
        : Array.isArray(raw?.data?.payments)
          ? raw.data.payments
          : [];

    return list.map((payment) => {
      const amount = Number(payment.amount ?? payment.totalAmount ?? 0);
      const status = String(payment.status || 'pending').toLowerCase();
      const dateValue = payment.date || payment.paymentDate || payment.createdAt || payment.updatedAt;
      const safeDate = dateValue ? new Date(dateValue) : null;
      const month = payment.month ?? (safeDate ? safeDate.getMonth() + 1 : null);
      const year = payment.year ?? (safeDate ? safeDate.getFullYear() : null);

      return {
        id: payment.id || payment._id || `${month || 'm'}-${year || 'y'}-${amount}`,
        amount,
        status,
        month,
        year,
        period: payment.period || (month && year ? `${month}/${year}` : null),
        date: safeDate && !Number.isNaN(safeDate.getTime()) ? safeDate : null
      };
    });
  };

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get('/dashboard/stats');
      const recentRes = await api.get('/payments/recent').catch(() => ({ data: { payments: [] } }));
      const historyRes = await api.get('/payments/history').catch(() => ({ data: { payments: [] } }));
      const dueRes = await api.get('/payments/due').catch(() => ({ data: null }));

      const normalizedRecent = normalizePayments(recentRes?.data);
      const normalizedHistory = normalizePayments(historyRes?.data);
      const sourcePayments = normalizedRecent.length > 0 ? normalizedRecent : normalizedHistory;

      const deduped = new Map();
      sourcePayments.forEach((payment) => {
        const key = payment.id || `${payment.period}-${payment.amount}-${payment.status}`;
        if (!deduped.has(key)) deduped.set(key, payment);
      });

      const sortedPayments = Array.from(deduped.values()).sort((a, b) => {
        const aTime = a.date ? a.date.getTime() : 0;
        const bTime = b.date ? b.date.getTime() : 0;
        return bTime - aTime;
      });

      setStats(statsRes.data);
      setPayments(sortedPayments);
      setMonthlyDue({
        month: dueRes?.data?.month ?? new Date().getMonth() + 1,
        year: dueRes?.data?.year ?? new Date().getFullYear(),
        hasDue: !!dueRes?.data?.hasDue,
        dueAmount: dueRes?.data?.dueAmount ?? null,
        outstanding: dueRes?.data?.outstanding ?? null,
        baseDueAmount: dueRes?.data?.baseDueAmount ?? null,
        extraChargeTotal: dueRes?.data?.extraChargeTotal ?? 0,
        notes: dueRes?.data?.notes ?? null,
        paymentStatus: String(dueRes?.data?.paymentStatus || 'unpaid').toLowerCase(),
        paidAmount: dueRes?.data?.paidAmount ?? null,
        paidAt: dueRes?.data?.paidAt ?? null,
        totalOutstanding: Number(dueRes?.data?.totalOutstanding ?? 0),
        pendingMonths: Number(dueRes?.data?.pendingMonths ?? 0),
        missedMonths: Number(dueRes?.data?.missedMonths ?? 0),
        nextPendingDue: dueRes?.data?.nextPendingDue ?? null,
        latestPaidItem: dueRes?.data?.latestPaidItem ?? null,
        dueItems: Array.isArray(dueRes?.data?.dueItems) ? dueRes.data.dueItems : []
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', {
        message: err?.message,
        status: err?.response?.status,
        url: err?.config?.url,
        data: err?.response?.data
      });
      setStats({
        totalRevenue: 0,
        totalPayments: 0,
        pendingPayments: 0,
        activeClients: 0
      });
      setPayments([]);
      setMonthlyDue({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        hasDue: false,
        dueAmount: null,
        outstanding: null,
        baseDueAmount: null,
        extraChargeTotal: 0,
        notes: null,
        paymentStatus: 'unpaid',
        paidAmount: null,
        paidAt: null,
        totalOutstanding: 0,
        pendingMonths: 0,
        missedMonths: 0,
        nextPendingDue: null,
        latestPaidItem: null,
        dueItems: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(Number(value) || 0);

  const currentMonth = new Date().getMonth() + 1;
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
  const dueMonthLabel = new Date(Number(monthlyDue.year), Number(monthlyDue.month || 1) - 1, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric'
  });
  const nextPendingLabel = monthlyDue.nextPendingDue
    ? new Date(Number(monthlyDue.nextPendingDue.year), Number(monthlyDue.nextPendingDue.month || 1) - 1, 1).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : null;
  const duePanelLabel = monthlyDue.totalOutstanding > 0
    ? nextPendingLabel || dueMonthLabel
    : dueMonthLabel;
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const monthlyRevenue = payments
    .filter((p) => p.date && p.date.getMonth() + 1 === currentMonth && p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const successRate = payments.length > 0
    ? ((payments.filter((p) => p.status === 'paid').length / payments.length) * 100).toFixed(1)
    : 0;

  const dueStatusLabel = monthlyDue.totalOutstanding > 0
    ? `Pending ${monthlyDue.pendingMonths}`
    : monthlyDue.paymentStatus === 'paid'
      ? 'Paid'
      : monthlyDue.hasDue
        ? 'Pending'
        : 'Not assigned';
  const latestPaidPayment = payments.find((payment) => payment.status === 'paid') || null;
  const latestPaidLabel = latestPaidPayment
    ? new Date(Number(latestPaidPayment.year), Number(latestPaidPayment.month || 1) - 1, 1).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : null;
  const headerSummaryLabel = monthlyDue.totalOutstanding > 0
    ? 'Outstanding Balance'
    : monthlyDue.hasDue
      ? `${dueMonthLabel} Due`
      : latestPaidPayment
        ? 'Latest Payment'
        : `${currentMonthName} Due`;
  const headerSummaryValue = monthlyDue.totalOutstanding > 0
    ? formatCurrency(monthlyDue.totalOutstanding)
    : monthlyDue.hasDue
      ? formatCurrency(monthlyDue.dueAmount)
    : latestPaidPayment
      ? formatCurrency(latestPaidPayment.amount)
      : 'No due assigned';
  const headerSummaryMeta = monthlyDue.totalOutstanding > 0
    ? `${monthlyDue.pendingMonths} month(s) pending${monthlyDue.missedMonths > 0 ? `, ${monthlyDue.missedMonths} overdue` : ''}`
    : monthlyDue.paymentStatus === 'paid'
      ? 'Already paid'
      : monthlyDue.hasDue
        ? 'Awaiting payment'
      : latestPaidLabel
        ? `${latestPaidLabel} settled`
        : 'Waiting for admin assignment';

  const statCards = [
    {
      title: 'Total Balance',
      value: showBalance ? formatCurrency(stats.totalRevenue) : '\u20A6******',
      change: `${stats.totalPayments || 0} payments`,
      trend: 'up',
      icon: <Wallet size={22} />,
      gradient: 'var(--gradient-primary)'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(monthlyRevenue),
      change: `${payments.filter((p) => p.date && p.date.getMonth() + 1 === currentMonth).length} transactions`,
      trend: 'up',
      icon: <TrendingUp size={22} />,
      gradient: 'var(--gradient-secondary)'
    },
    {
      title: 'Pending Payments',
      value: String(monthlyDue.pendingMonths || 0),
      change: monthlyDue.totalOutstanding > 0 ? formatCurrency(monthlyDue.totalOutstanding) : 'No outstanding dues',
      trend: 'down',
      icon: <Clock size={22} />,
      gradient: 'var(--gradient-danger)'
    },
    {
      title: 'Success Rate',
      value: `${successRate}%`,
      change: `${payments.filter((p) => p.status === 'paid').length} successful`,
      trend: 'up',
      icon: <Activity size={22} />,
      gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)'
    }
  ];

  const quickActions = [
    {
      icon: <Send size={18} />,
      label: 'Send Money',
      description: 'Transfer to anyone',
      action: () => navigate('/app/payments')
    },
    {
      icon: <Download size={18} />,
      label: 'Request Payment',
      description: 'Get paid faster',
      action: () => navigate('/app/payments')
    },
    {
      icon: <BarChart3 size={18} />,
      label: 'Analytics',
      description: 'View insights',
      action: () => navigate('/app/payments')
    },
    {
      icon: <Settings size={18} />,
      label: 'Settings',
      description: 'Manage account',
      action: () => navigate('/app/settings')
    }
  ];

  const recentActivity = payments.slice(0, 5).map((payment) => ({
    title: payment.status === 'paid' ? 'Payment Completed' : 'Payment Pending',
    description: `Month ${payment.period || `${payment.month || '-'} / ${payment.year || '-'}`}`,
    amount: `${payment.status === 'paid' ? '+' : '-'}${formatCurrency(payment.amount)}`,
    time: payment.date ? payment.date.toLocaleDateString() : 'No date',
    status: payment.status,
    icon: payment.status === 'paid' ? <CheckCircle size={18} /> : <Clock size={18} />
  }));

  const displayActivity = recentActivity.length > 0
    ? recentActivity
    : [
        {
          title: 'Dashboard Initialized',
          description: 'Your PSP dashboard is active and ready.',
          amount: formatCurrency(0),
          time: new Date().toLocaleDateString(),
          status: 'pending',
          icon: <Clock size={18} />
        },
        {
          title: 'Account Verified',
          description: 'Security checks completed successfully.',
          amount: formatCurrency(0),
          time: new Date().toLocaleDateString(),
          status: 'paid',
          icon: <CheckCircle size={18} />
        }
      ];
  const paidItems = payments
    .filter((payment) => payment.status === 'paid')
    .slice(0, 4)
    .map((payment) => {
      const periodLabel = new Date(Number(payment.year), Number(payment.month || 1) - 1, 1).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      return {
        ...payment,
        periodLabel,
        receiptStatus: 'Receipt ready'
      };
    });

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="header-content">
          <div>
            <div className="welcome-badge">
              <Sparkles size={15} />
              <span>Welcome back</span>
            </div>
            <h1>PSP User Dashboard</h1>
            <p>Track payments, monitor performance, and manage your account.</p>
            <div className="header-meta">
              <span>
                <CalendarDays size={14} />
                {todayLabel}
              </span>
              <span>
                <Activity size={14} />
                {stats.totalPayments || 0} total transactions
              </span>
            </div>
          </div>

          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => navigate('/app/payments')}>
              <Send size={17} />
              New Transaction
            </button>
            <div className="header-summary-card">
              <div className="summary-label">{headerSummaryLabel}</div>
              <div className="summary-value">{headerSummaryValue}</div>
              <div className="summary-meta">{headerSummaryMeta}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ y: -5 }}
          >
            <div className="stat-header">
              <div className="stat-icon" style={{ background: stat.gradient }}>
                {stat.icon}
              </div>
              {stat.title === 'Total Balance' && (
                <button className="toggle-balance" onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              )}
            </div>

            <div className="stat-body">
              <div className="stat-label">{stat.title}</div>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-change ${stat.trend}`}>
                {stat.trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span>{stat.change}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="due-section card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="section-header">
          <h3>Monthly Dues</h3>
          <span className={`due-status-pill ${monthlyDue.paymentStatus === 'paid' ? 'paid' : monthlyDue.hasDue ? 'pending' : 'empty'}`}>
            <BadgeCheck size={14} />
            {dueStatusLabel}
          </span>
        </div>

        <div className="due-grid">
            <div className="due-highlight">
              <div className="due-label">{duePanelLabel}</div>
	              <div className="due-amount">
	                {monthlyDue.totalOutstanding > 0
	                  ? formatCurrency(monthlyDue.totalOutstanding)
	                  : monthlyDue.hasDue
	                    ? formatCurrency(monthlyDue.dueAmount)
	                  : latestPaidPayment
	                    ? `Paid ${formatCurrency(latestPaidPayment.amount)}`
	                    : 'No due assigned'}
	              </div>
	              <p>
	                {monthlyDue.totalOutstanding > 0
	                  ? `Outstanding across ${monthlyDue.pendingMonths} month(s)${nextPendingLabel ? `. Next unpaid month: ${nextPendingLabel}.` : '.'} Remaining this month: ${formatCurrency(monthlyDue.outstanding ?? 0)}.`
	                  : monthlyDue.notes
	                  || (latestPaidLabel ? `Latest cleared payment was for ${latestPaidLabel}.` : 'Your company has not attached a note for this month.')}
	              </p>
	            </div>

          <div className="due-meta">
            <div className="due-meta-item">
              <span>Status</span>
              <strong>{dueStatusLabel}</strong>
            </div>
	            <div className="due-meta-item">
	              <span>Total Due (This Month)</span>
	              <strong>{monthlyDue.hasDue ? formatCurrency(monthlyDue.dueAmount) : 'N/A'}</strong>
	            </div>
	            <div className="due-meta-item">
	              <span>Remaining (This Month)</span>
	              <strong>{monthlyDue.hasDue ? formatCurrency(monthlyDue.outstanding ?? monthlyDue.dueAmount ?? 0) : 'N/A'}</strong>
	            </div>
	            <div className="due-meta-item">
	              <span>Total Outstanding</span>
	              <strong>{monthlyDue.totalOutstanding > 0 ? formatCurrency(monthlyDue.totalOutstanding) : 'N/A'}</strong>
	            </div>
            <div className="due-meta-item">
              <span>Missed Months</span>
              <strong>{monthlyDue.missedMonths || 0}</strong>
            </div>
            <div className="due-meta-item">
              <span>Paid Amount</span>
              <strong>
                {monthlyDue.paidAmount != null
                  ? formatCurrency(monthlyDue.paidAmount)
                  : latestPaidPayment
                    ? formatCurrency(latestPaidPayment.amount)
                    : 'N/A'}
              </strong>
            </div>
            <div className="due-meta-item">
              <span>Paid On</span>
              <strong>
                {monthlyDue.paidAt
                  ? new Date(monthlyDue.paidAt).toLocaleDateString()
                  : latestPaidPayment?.date
                    ? latestPaidPayment.date.toLocaleDateString()
                    : 'Not paid yet'}
              </strong>
            </div>
          </div>
        </div>

        {monthlyDue.totalOutstanding > 0 ? (
          <button className="btn btn-primary due-action-btn" onClick={() => navigate('/app/payments')}>
            <CreditCard size={17} />
            Pay Outstanding Dues
          </button>
        ) : null}
      </motion.div>

      <motion.div
        className="paid-items-section card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
      >
        <div className="section-header">
          <h3>Paid For</h3>
          <button className="btn-link" onClick={() => navigate('/app/payments')}>
            Payment History
            <ArrowUpRight size={15} />
          </button>
        </div>

        {paidItems.length > 0 ? (
          <div className="paid-items-grid">
            {paidItems.map((item, index) => (
              <motion.article
                key={item.id}
                className="paid-item-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 + index * 0.05 }}
              >
                <div className="paid-item-top">
                  <span className="paid-item-period">{item.periodLabel}</span>
                  <span className="paid-item-badge">
                    <CheckCircle size={13} />
                    Paid
                  </span>
                </div>
                <div className="paid-item-amount">{formatCurrency(item.amount)}</div>
                <div className="paid-item-meta">
                  <span>
                    <CalendarDays size={13} />
                    {item.date ? item.date.toLocaleDateString() : 'No date'}
                  </span>
                  <span>
                    <BadgeCheck size={13} />
                    {item.receiptStatus}
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="paid-items-empty">
            <CheckCircle size={18} />
            <span>No completed payments yet.</span>
          </div>
        )}
      </motion.div>

      <motion.div
        className="quick-actions-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="section-title-row">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              className="quick-action-card"
              onClick={action.action}
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + index * 0.06 }}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <div className="action-label">{action.label}</div>
                <div className="action-description">{action.description}</div>
              </div>
              <ChevronRight size={18} className="action-arrow" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="make-payment-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="section-title-row">
          <h2>Payment Options</h2>
        </div>
        <div className="payment-options-grid">
          <motion.div
            className="payment-option-card"
            whileHover={{ scale: 1.01, y: -4 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/app/payments')}
          >
            <div className="payment-icon">
              <Send size={30} />
            </div>
            <div className="payment-content">
              <h3>Send Money</h3>
              <p>Transfer funds to another account instantly.</p>
              <div className="payment-features">
                <span className="feature-tag">Instant</span>
                <span className="feature-tag">Secure</span>
              </div>
            </div>
            <ArrowUpRight size={20} className="payment-arrow" />
          </motion.div>

          <motion.div
            className="payment-option-card"
            whileHover={{ scale: 1.01, y: -4 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/app/payments')}
          >
            <div className="payment-icon">
              <CreditCard size={30} />
            </div>
            <div className="payment-content">
              <h3>Pay Bills</h3>
              <p>Pay utilities, subscriptions, and recurring services.</p>
              <div className="payment-features">
                <span className="feature-tag">Automated</span>
                <span className="feature-tag">Scheduled</span>
              </div>
            </div>
            <ArrowUpRight size={20} className="payment-arrow" />
          </motion.div>

          <motion.div
            className="payment-option-card"
            whileHover={{ scale: 1.01, y: -4 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/app/payments')}
          >
            <div className="payment-icon">
              <DollarSign size={30} />
            </div>
            <div className="payment-content">
              <h3>Quick Transfer</h3>
              <p>Move funds quickly with minimal processing delay.</p>
              <div className="payment-features">
                <span className="feature-tag">Low Fee</span>
                <span className="feature-tag">24/7</span>
              </div>
            </div>
            <ArrowUpRight size={20} className="payment-arrow" />
          </motion.div>
        </div>
      </motion.div>

      <div className="dashboard-content-grid">
        <motion.div
          className="activity-section card"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="section-header">
            <h3>Recent Activity</h3>
            <button className="btn-link" onClick={() => navigate('/app/payments')}>
              View All
              <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="activity-list">
            {displayActivity.map((activity, index) => (
              <motion.div
                key={`${activity.time}-${index}`}
                className="activity-item"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.08 }}
              >
                <div className={`activity-icon ${activity.status}`}>{activity.icon}</div>
                <div className="activity-details">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-description">{activity.description}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
                <div className={`activity-amount ${activity.amount.startsWith('+') ? 'positive' : 'negative'}`}>
                  {activity.amount}
                </div>
              </motion.div>
            ))}

          </div>
        </motion.div>

        <motion.div
          className="overview-section card"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="section-header">
            <h3>Account Overview</h3>
          </div>

          <div className="overview-content">
            <div className="overview-item">
              <div className="overview-icon">
                <Shield size={18} />
              </div>
              <div className="overview-details">
                <div className="overview-label">Account Status</div>
                <div className="overview-value verified">Verified</div>
              </div>
            </div>

            <div className="overview-item">
              <div className="overview-icon">
                <Globe size={18} />
              </div>
              <div className="overview-details">
                <div className="overview-label">Account Type</div>
                <div className="overview-value">Business</div>
              </div>
            </div>

            <div className="overview-item">
              <div className="overview-icon">
                <Lock size={18} />
              </div>
              <div className="overview-details">
                <div className="overview-label">Security Level</div>
                <div className="overview-value">High</div>
              </div>
            </div>

            <div className="overview-item">
              <div className="overview-icon">
                <Zap size={18} />
              </div>
              <div className="overview-details">
                <div className="overview-label">Transaction Limit</div>
                <div className="overview-value">{formatCurrency(5000000)}</div>
              </div>
            </div>
          </div>

          <button className="btn btn-outline w-100" onClick={() => navigate('/app/settings')}>
            Manage Account
            <ArrowUpRight size={15} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
