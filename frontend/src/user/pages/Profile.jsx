import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import api from '../../api/axios';
import Loading from '../../components/Loading';
import './Profile.css';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

const formatDate = (value, options) => {
  if (!value) return 'N/A';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', options);
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

const normalizePaymentStatus = (value) => {
  const status = String(value || 'pending').toLowerCase();
  return status === 'unpaid' ? 'pending' : status;
};

const normalizePayments = (payload) => {
  const list = Array.isArray(payload?.payments)
    ? payload.payments
    : Array.isArray(payload?.data?.payments)
      ? payload.data.payments
      : Array.isArray(payload)
        ? payload
        : [];

  return list.map((item) => {
    const dateRaw = item.paymentDate || item.date || item.createdAt || item.updatedAt;
    const date = dateRaw ? new Date(dateRaw) : null;

    return {
      id: item._id || item.id || `${item.month || 'm'}-${item.year || 'y'}-${item.amount || 0}`,
      month: Number(item.month || 0),
      year: Number(item.year || 0),
      amount: Number(item.amount || item.dueAmount || 0),
      dueAmount: item.dueAmount != null ? Number(item.dueAmount) : null,
      status: normalizePaymentStatus(item.status),
      notes: item.notes || '',
      paymentDate: date && !Number.isNaN(date.getTime()) ? date : null,
      uuid: item.uuid || null
    };
  });
};

const getActivityTone = (icon) => {
  if (icon === 'success') return 'success';
  if (icon === 'warning') return 'warning';
  return 'info';
};

const fetchAddressData = async () => {
  try {
    const response = await api.get('/api/address');
    return response.data?.address || null;
  } catch (error) {
    if (error?.response?.status === 404) {
      return null;
    }

    const fallback = await api.get('/address');
    return fallback.data?.address || fallback.data || null;
  }
};

const fetchActivityData = async () => {
  try {
    const response = await api.get('/api/user/activity?limit=6');
    return response.data?.activities || [];
  } catch (error) {
    if (error?.response?.status !== 404) {
      throw error;
    }

    const fallback = await api.get('/users/activity?limit=6');
    return fallback.data?.activities || [];
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [address, setAddress] = useState(null);
  const [payments, setPayments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [dueInfo, setDueInfo] = useState({
    hasDue: false,
    dueAmount: null,
    outstanding: null,
    baseDueAmount: null,
    extraChargeTotal: 0,
    paymentStatus: 'unpaid',
    totalOutstanding: 0,
    pendingMonths: 0,
    missedMonths: 0,
    nextPendingDue: null,
    paidAt: null,
    paidAmount: null,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError('');

        const [meResult, addressResult, paymentsResult, dueResult, activityResult] = await Promise.allSettled([
          api.get('/auth/me'),
          fetchAddressData(),
          api.get('/payments/history'),
          api.get('/payments/due'),
          fetchActivityData()
        ]);

        if (meResult.status !== 'fulfilled') {
          throw meResult.reason;
        }

        setUser(meResult.value.data?.user || null);
        setAddress(addressResult.status === 'fulfilled' ? addressResult.value : null);

        const normalizedPayments = paymentsResult.status === 'fulfilled'
          ? normalizePayments(paymentsResult.value.data).sort((a, b) => {
              const aTime = a.paymentDate ? a.paymentDate.getTime() : 0;
              const bTime = b.paymentDate ? b.paymentDate.getTime() : 0;
              return bTime - aTime;
            })
          : [];
        setPayments(normalizedPayments);

	        setDueInfo(
	          dueResult.status === 'fulfilled'
	            ? {
	                hasDue: !!dueResult.value.data?.hasDue,
	                dueAmount: dueResult.value.data?.dueAmount ?? null,
	                outstanding: dueResult.value.data?.outstanding ?? null,
	                baseDueAmount: dueResult.value.data?.baseDueAmount ?? null,
	                extraChargeTotal: dueResult.value.data?.extraChargeTotal ?? 0,
	                paymentStatus: String(dueResult.value.data?.paymentStatus || 'unpaid').toLowerCase(),
	                totalOutstanding: Number(dueResult.value.data?.totalOutstanding ?? 0),
	                pendingMonths: Number(dueResult.value.data?.pendingMonths ?? 0),
	                missedMonths: Number(dueResult.value.data?.missedMonths ?? 0),
	                nextPendingDue: dueResult.value.data?.nextPendingDue ?? null,
	                paidAt: dueResult.value.data?.paidAt ?? null,
	                paidAmount: dueResult.value.data?.paidAmount ?? null,
	                month: dueResult.value.data?.month ?? new Date().getMonth() + 1,
	                year: dueResult.value.data?.year ?? new Date().getFullYear()
	              }
	            : {
	                hasDue: false,
	                dueAmount: null,
	                outstanding: null,
	                baseDueAmount: null,
	                extraChargeTotal: 0,
	                paymentStatus: 'unpaid',
	                totalOutstanding: 0,
	                pendingMonths: 0,
	                missedMonths: 0,
	                nextPendingDue: null,
	                paidAt: null,
	                paidAmount: null,
	                month: new Date().getMonth() + 1,
	                year: new Date().getFullYear()
	              }
	        );

        setActivities(activityResult.status === 'fulfilled' ? activityResult.value : []);
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err?.response?.data?.error || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    window.dispatchEvent(new Event('userLoggedOut'));
    navigate('/');
  };

  const profileSummary = useMemo(() => {
    const paidPayments = payments.filter((payment) => payment.status === 'paid');
    const pendingPayments = payments.filter((payment) => payment.status === 'pending');
    const latestPayment = paidPayments[0] || null;
    const totalPaidAmount = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);

    return {
      totalPayments: payments.length,
      paidPayments: paidPayments.length,
      pendingPayments: pendingPayments.length,
      totalPaidAmount,
      latestPayment
    };
  }, [payments]);

  const memberSinceLabel = useMemo(
    () =>
      formatDate(user?.createdAt, {
        month: 'long',
        year: 'numeric'
      }),
    [user?.createdAt]
  );

  const profileId = user?._id ? `PSP-${String(user._id).slice(-8).toUpperCase()}` : 'Not available';
  const currentDueLabel = formatDate(new Date(Number(dueInfo.year), Number(dueInfo.month || 1) - 1, 1), {
    month: 'long',
    year: 'numeric'
  });
  const nextPendingLabel = dueInfo.nextPendingDue
    ? formatDate(new Date(Number(dueInfo.nextPendingDue.year), Number(dueInfo.nextPendingDue.month || 1) - 1, 1), {
        month: 'long',
        year: 'numeric'
      })
    : 'None';
  const roleLabel = Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles[0] : 'client';
  const statusLabel = user?.status || 'active';
  const outstandingAmount = dueInfo.totalOutstanding > 0 ? dueInfo.totalOutstanding : 0;
  const currentDueAmount = dueInfo.hasDue ? Number(dueInfo.dueAmount || 0) : 0;
  const currentRemainingAmount = dueInfo.hasDue ? Number(dueInfo.outstanding ?? currentDueAmount) : 0;

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-shell profile-loading-shell">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-shell">
          <div className="profile-error-card">
            <h2>Profile unavailable</h2>
            <p>{error}</p>
            <button type="button" className="profile-btn profile-btn-primary" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <motion.section
          className="profile-hero"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="profile-hero-copy">
            <div className="profile-kicker">
              <ShieldCheck size={14} />
              <span>PSP Account Profile</span>
            </div>
            <div className="profile-title-row">
              <div className="profile-avatar">{getInitials(user?.name)}</div>
              <div>
                <h1>{user?.name || 'Unnamed user'}</h1>
                <p className="profile-email-line">
                  <Mail size={16} />
                  <span>{user?.email || 'No email on file'}</span>
                </p>
              </div>
            </div>
            <div className="profile-meta-row">
              <span className="profile-chip">
                <BadgeCheck size={14} />
                {statusLabel}
              </span>
              <span className="profile-chip">
                <User size={14} />
                {roleLabel}
              </span>
              <span className="profile-chip">
                <CalendarDays size={14} />
                Member since {memberSinceLabel}
              </span>
            </div>
          </div>

          <div className="profile-hero-actions">
            <button type="button" className="profile-btn profile-btn-soft" onClick={() => navigate('/app/payments')}>
              <History size={16} />
              Payments
            </button>
            <button type="button" className="profile-btn profile-btn-soft" onClick={() => navigate('/app/settings')}>
              <Settings size={16} />
              Settings
            </button>
            <button type="button" className="profile-btn profile-btn-danger" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </motion.section>

        <section className="profile-grid">
          <motion.article
            className="profile-card profile-card-primary"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            <div className="profile-card-head">
              <div>
                <span className="profile-section-label">Balance Overview</span>
                <h2>{outstandingAmount > 0 ? 'Outstanding dues' : 'Current payment status'}</h2>
              </div>
              <div className="profile-icon-badge">
                <Wallet size={20} />
              </div>
            </div>

            <div className="profile-balance-row">
              <div>
                <strong>{formatCurrency(outstandingAmount > 0 ? outstandingAmount : currentDueAmount)}</strong>
                <p>
                  {outstandingAmount > 0
                    ? `${dueInfo.pendingMonths} pending month(s)${dueInfo.missedMonths > 0 ? `, ${dueInfo.missedMonths} overdue` : ''}`
                    : dueInfo.paymentStatus === 'paid'
                      ? `${currentDueLabel} already settled`
                      : dueInfo.hasDue
                        ? `${currentDueLabel} is awaiting payment`
                        : 'No current due has been assigned yet'}
                </p>
              </div>
              <span className={`profile-status-pill profile-status-${outstandingAmount > 0 ? 'pending' : dueInfo.paymentStatus === 'paid' ? 'paid' : 'neutral'}`}>
                {outstandingAmount > 0 ? 'Pending' : dueInfo.paymentStatus === 'paid' ? 'Paid' : 'Open'}
              </span>
            </div>

            <div className="profile-balance-metrics">
              <div>
                <span>Current billing month</span>
                <strong>{currentDueLabel}</strong>
              </div>
              <div>
                <span>Remaining (this month)</span>
                <strong>{dueInfo.hasDue ? formatCurrency(currentRemainingAmount) : 'N/A'}</strong>
              </div>
              <div>
                <span>Next unpaid month</span>
                <strong>{nextPendingLabel}</strong>
              </div>
              <div>
                <span>Last settled</span>
                <strong>{dueInfo.paidAt ? formatDate(dueInfo.paidAt, { month: 'short', day: 'numeric', year: 'numeric' }) : 'None yet'}</strong>
              </div>
            </div>

            <div className="profile-card-actions">
              <button type="button" className="profile-btn profile-btn-primary" onClick={() => navigate('/app/payments')}>
                <CreditCard size={16} />
                {outstandingAmount > 0 || dueInfo.hasDue ? 'Pay or Review Dues' : 'Open Payments'}
              </button>
              <button type="button" className="profile-btn profile-btn-ghost" onClick={() => navigate('/app/settings')}>
                Update Account
                <ArrowRight size={15} />
              </button>
            </div>
          </motion.article>

          <motion.article
            className="profile-card profile-stats-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <div className="profile-card-head">
              <div>
                <span className="profile-section-label">Payment Health</span>
                <h2>Live account stats</h2>
              </div>
            </div>

            <div className="profile-stats-grid">
              <div className="profile-stat">
                <span>Total records</span>
                <strong>{profileSummary.totalPayments}</strong>
              </div>
              <div className="profile-stat">
                <span>Successful payments</span>
                <strong>{profileSummary.paidPayments}</strong>
              </div>
              <div className="profile-stat">
                <span>Pending records</span>
                <strong>{profileSummary.pendingPayments}</strong>
              </div>
              <div className="profile-stat">
                <span>Total paid</span>
                <strong>{formatCurrency(profileSummary.totalPaidAmount)}</strong>
              </div>
            </div>
          </motion.article>

          <motion.article
            className="profile-card profile-card-half"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            <div className="profile-card-head">
              <div>
                <span className="profile-section-label">Identity</span>
                <h2>Account details</h2>
              </div>
            </div>

            <div className="profile-detail-list">
              <div className="profile-detail-item">
                <User size={17} />
                <div>
                  <span>Full name</span>
                  <strong>{user?.name || 'Not provided'}</strong>
                </div>
              </div>
              <div className="profile-detail-item">
                <Mail size={17} />
                <div>
                  <span>Email</span>
                  <strong>{user?.email || 'Not provided'}</strong>
                </div>
              </div>
              <div className="profile-detail-item">
                <Phone size={17} />
                <div>
                  <span>Phone</span>
                  <strong>{user?.phone || 'Not added yet'}</strong>
                </div>
              </div>
              <div className="profile-detail-item">
                <BadgeCheck size={17} />
                <div>
                  <span>Profile ID</span>
                  <strong>{profileId}</strong>
                </div>
              </div>
              <div className="profile-detail-item">
                <Building2 size={17} />
                <div>
                  <span>Company assignment</span>
                  <strong>{user?.company ? 'Assigned' : 'Not assigned'}</strong>
                </div>
              </div>
              <div className="profile-detail-item">
                <ShieldCheck size={17} />
                <div>
                  <span>Verification</span>
                  <strong>{user?.isVerified ? 'Verified account' : 'Verification pending'}</strong>
                </div>
              </div>
            </div>
          </motion.article>

          <motion.article
            className="profile-card profile-card-half"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            <div className="profile-card-head">
              <div>
                <span className="profile-section-label">Address</span>
                <h2>Service location</h2>
              </div>
              <MapPin size={18} />
            </div>

            {address ? (
              <div className="profile-address-block">
                <p>{address.houseAddress || 'House address not set'}</p>
                <p>{address.street || 'Street not set'}</p>
                <p>{[address.state, address.country].filter(Boolean).join(', ') || 'Location not set'}</p>
              </div>
            ) : (
              <div className="profile-empty-block">
                <p>No service address has been added to this account yet.</p>
              </div>
            )}

            <button type="button" className="profile-btn profile-btn-soft profile-full-btn" onClick={() => navigate('/app/settings')}>
              {address ? 'Update Address' : 'Add Address'}
            </button>
          </motion.article>

          <motion.article
            className="profile-card profile-card-wide"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
          >
            <div className="profile-card-head">
              <div>
                <span className="profile-section-label">Recent Payments</span>
                <h2>Transaction snapshot</h2>
              </div>
              <button type="button" className="profile-inline-link" onClick={() => navigate('/app/payments')}>
                View full history
              </button>
            </div>

            {payments.length > 0 ? (
              <div className="profile-payment-list">
                {payments.slice(0, 4).map((payment) => (
                  <div key={payment.id} className="profile-payment-item">
                    <div>
                      <strong>
                        {formatDate(new Date(Number(payment.year), Number(payment.month || 1) - 1, 1), {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </strong>
                      <span>{payment.uuid || payment.id}</span>
                    </div>
                    <div>
                      <strong>{formatCurrency(payment.amount)}</strong>
                      <span>{payment.paymentDate ? formatDateTime(payment.paymentDate) : 'No payment timestamp'}</span>
                    </div>
                    <span className={`profile-status-pill profile-status-${payment.status === 'paid' ? 'paid' : 'pending'}`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="profile-empty-block">
                <p>No payment records are available yet.</p>
              </div>
            )}
          </motion.article>

          <motion.article
            className="profile-card profile-card-wide"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
          >
            <div className="profile-card-head">
              <div>
                <span className="profile-section-label">Activity</span>
                <h2>Account timeline</h2>
              </div>
            </div>

            {activities.length > 0 ? (
              <div className="profile-activity-list">
                {activities.map((activity) => (
                  <div key={activity.id} className="profile-activity-item">
                    <span className={`profile-activity-dot profile-activity-${getActivityTone(activity.icon)}`} />
                    <div className="profile-activity-copy">
                      <strong>{activity.title || 'Activity update'}</strong>
                      <p>{activity.description || 'No additional details available.'}</p>
                    </div>
                    <time>{formatDateTime(activity.time)}</time>
                  </div>
                ))}
              </div>
            ) : (
              <div className="profile-empty-block">
                <p>No recent activity has been recorded for this account.</p>
              </div>
            )}
          </motion.article>
        </section>
      </div>
    </div>
  );
};

export default Profile;
