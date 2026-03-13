import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  Filter,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Search,
  BarChart,
  Calendar,
  FileText,
  X,
  AlertTriangle,
  User,
  Clock,
} from 'lucide-react';
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
	Line,
} from 'recharts';
import api from '../../api/axios';
import { useAuth } from '../../AuthContext';
import './AdminPayments.css';

const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const compact = new Intl.NumberFormat('en-NG', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const pad2 = (n) => String(n).padStart(2, '0');
const toDateInput = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
const initials = (value) => {
  const input = String(value ?? '').trim();
  if (!input) return '?';
  const tokens = input.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  return input.slice(0, 2).toUpperCase();
};

const statusMeta = (status) => {
  const s = String(status || 'unpaid').toLowerCase();
  if (s === 'paid') return { key: 'paid', icon: CheckCircle };
  if (s === 'pending') return { key: 'pending', icon: Clock };
  if (s === 'failed') return { key: 'failed', icon: AlertTriangle };
  return { key: 'unpaid', icon: XCircle };
};

	const AdminPayments = () => {
	  const [payments, setPayments] = useState([]);
	  const [loading, setLoading] = useState(true);
	  const [filters, setFilters] = useState({
	    month: '',
	    year: '',
	    uuid: '',
	    email: '',
	    status: '',
	    from: '',
	    to: '',
	  });
	  const filtersRef = useRef(filters);
		const [stats, setStats] = useState({
			totalRevenue: 0,
			totalPayments: 0,
			paidPayments: 0,
      unpaidPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
		});
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClient, setDrawerClient] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState('');
  const [drawerPayments, setDrawerPayments] = useState([]);
  const [drawerSummary, setDrawerSummary] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCompany = !!user?.roles?.includes('company');
  const isAdmin = !!user?.roles?.includes('admin') && !isCompany;
  const actorLabel = isCompany ? 'Company' : isAdmin ? 'Admin' : 'User';
  const loginPath = isCompany ? '/company-login' : isAdmin ? '/admin-login' : '/login';

	  useEffect(() => {
	    filtersRef.current = filters;
	  }, [filters]);

	  const fetchPayments = useCallback(async (nextFilters) => {
	    const activeFilters = nextFilters || filtersRef.current;
	    setLoading(true);
	    try {
	      const params = new URLSearchParams();
	      if (activeFilters.month) params.append('month', activeFilters.month);
	      if (activeFilters.year) params.append('year', activeFilters.year);
	      if (activeFilters.uuid) params.append('uuid', activeFilters.uuid);
	      if (activeFilters.email) params.append('email', activeFilters.email);
	      if (activeFilters.status) params.append('status', activeFilters.status);
	      if (activeFilters.from) params.append('from', `${activeFilters.from}T00:00:00.000`);
	      if (activeFilters.to) params.append('to', `${activeFilters.to}T23:59:59.999`);

	      const res = await api.get(`/payments/all?${params.toString()}`);
	      const paymentsData = res.data.payments || [];
	      setPayments(paymentsData);

	      const totalRevenue = paymentsData
	        .filter((p) => p.status === 'paid')
	        .reduce((sum, p) => sum + (p.amount || 0), 0);
	      const paidPayments = paymentsData.filter((p) => p.status === 'paid').length;
	      const unpaidPayments = paymentsData.filter((p) => p.status === 'unpaid').length;
        const pendingPayments = paymentsData.filter((p) => p.status === 'pending').length;
        const failedPayments = paymentsData.filter((p) => p.status === 'failed').length;

	      setStats({
	        totalRevenue,
	        totalPayments: paymentsData.length,
	        paidPayments,
	        unpaidPayments,
          pendingPayments,
          failedPayments,
	      });
    } catch (err) {
      console.error('Error fetching payments:', err);
      if (err.response && err.response.status === 401) {
        navigate(loginPath);
        return;
      }
      setPayments([]);
	      setStats({
	        totalRevenue: 0,
	        totalPayments: 0,
	        paidPayments: 0,
	        unpaidPayments: 0,
          pendingPayments: 0,
          failedPayments: 0,
	      });
	    } finally {
	      setLoading(false);
	    }
			}, [navigate, loginPath]);

	  const fetchSummary = useCallback(async (nextFilters) => {
	    if (!isCompany) return;
	    const activeFilters = nextFilters || filtersRef.current;
	    setSummaryLoading(true);
	    setSummaryError('');
	    try {
	      const params = new URLSearchParams();
	      if (activeFilters.month) params.append('month', activeFilters.month);
	      if (activeFilters.year) params.append('year', activeFilters.year);
	      if (activeFilters.from) params.append('from', `${activeFilters.from}T00:00:00.000`);
	      if (activeFilters.to) params.append('to', `${activeFilters.to}T23:59:59.999`);

	      const res = await api.get(`/payments/company/summary?${params.toString()}`);
	      setSummary(res.data || null);
	    } catch (err) {
      console.error('Error fetching company summary:', err);
      setSummary(null);
      setSummaryError(err?.response?.data?.error || 'Unable to load company summary');
	    } finally {
	      setSummaryLoading(false);
	    }
	  }, [isCompany]);

	useEffect(() => {
		const token = sessionStorage.getItem('token');
		if (!token) {
			navigate(loginPath);
			return;
		}
		if (!isCompany && !isAdmin) {
			navigate('/login');
			return;
		}
		fetchPayments();
		fetchSummary();
	}, [fetchPayments, fetchSummary, navigate, loginPath, isCompany, isAdmin]);

	  const handleFilterChange = (e) => {
	    const { name, value } = e.target;
	    setFilters((prev) => ({ ...prev, [name]: value }));
	  };

	  const applyFilters = () => {
	    fetchPayments();
	    fetchSummary();
	  };

	  const clearFilters = () => {
	    const cleared = { month: '', year: '', uuid: '', email: '', status: '', from: '', to: '' };
	    setFilters(cleared);
	    fetchPayments(cleared);
	    fetchSummary(cleared);
	  };

  const exportData = () => {
    const csvContent = [
      ['UUID', 'Client', 'Month', 'Year', 'Amount', 'Status', 'Date'].join(','),
      ...payments.map((p) => [
        p.uuid,
        p.user?.email || 'N/A',
        p.month,
        p.year,
        p.amount,
        p.status,
        new Date(p.date).toLocaleDateString(),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

	  const setPreset = (preset) => {
	    const now = new Date();
	    if (preset === 'today') {
	      const today = toDateInput(now);
	      const next = { ...filtersRef.current, from: today, to: today };
	      setFilters(next);
	      fetchPayments(next);
	      fetchSummary(next);
	      return;
	    }
	    if (preset === 'last7') {
	      const start = new Date(now);
	      start.setDate(start.getDate() - 6);
	      const next = { ...filtersRef.current, from: toDateInput(start), to: toDateInput(now) };
	      setFilters(next);
	      fetchPayments(next);
	      fetchSummary(next);
	      return;
	    }
	    if (preset === 'month') {
	      const start = new Date(now.getFullYear(), now.getMonth(), 1);
	      const next = { ...filtersRef.current, from: toDateInput(start), to: toDateInput(now) };
	      setFilters(next);
	      fetchPayments(next);
	      fetchSummary(next);
	      return;
	    }
	    if (preset === 'clear') {
	      const next = { ...filtersRef.current, from: '', to: '' };
	      setFilters(next);
	      fetchPayments(next);
	      fetchSummary(next);
	    }
	  };

  const openReceipt = (payment) => {
    const companyName = user?.companyName || user?.name || 'Sompay';
    const clientEmail = payment.user?.email || 'N/A';
    const clientName = payment.user?.name || '';
    const paidOn = payment.receipt?.paidOn || payment.date || payment.createdAt;

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Payment Receipt</title>
    <style>
      *{box-sizing:border-box} body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial; margin:0; background:#f8fafc; color:#0f172a}
      .wrap{max-width:820px; margin:24px auto; padding:0 16px}
      .card{background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:20px}
      .head{display:flex; justify-content:space-between; gap:16px; align-items:flex-start}
      .brand{font-weight:900; font-size:18px}
      .muted{color:#64748b}
      .grid{display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:16px}
      .kv{border:1px solid #e2e8f0; border-radius:12px; padding:12px}
      .k{font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:.08em; font-weight:800}
      .v{margin-top:6px; font-size:14px; font-weight:800}
      .total{margin-top:14px; padding:12px; border-radius:12px; background:#fff7ed; border:1px solid rgba(212,175,55,.35)}
      .total .v{font-size:20px}
      .btn{margin-top:16px; display:flex; gap:10px}
      button{border:0; border-radius:10px; padding:10px 14px; font-weight:800; cursor:pointer}
      .p{background:#0f172a; color:#fff} .s{background:#e2e8f0; color:#0f172a}
      @media print{ .btn{display:none} body{background:#fff} .wrap{margin:0; max-width:none} }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="head">
          <div>
            <div class="brand">${escapeHtml(companyName)}</div>
            <div class="muted">Payment Receipt</div>
          </div>
          <div style="text-align:right">
            <div class="k">UUID</div>
            <div class="v">${escapeHtml(payment.uuid)}</div>
            <div class="muted" style="margin-top:6px">${escapeHtml(new Date(paidOn).toLocaleString())}</div>
          </div>
        </div>

        <div class="grid">
          <div class="kv"><div class="k">Client</div><div class="v">${escapeHtml(clientName || clientEmail)}</div></div>
          <div class="kv"><div class="k">Client Email</div><div class="v">${escapeHtml(clientEmail)}</div></div>
          <div class="kv"><div class="k">Period</div><div class="v">${escapeHtml(`${payment.month}/${payment.year}`)}</div></div>
          <div class="kv"><div class="k">Status</div><div class="v">${escapeHtml(payment.status)}</div></div>
        </div>

        <div class="total">
          <div class="k">Amount Paid</div>
          <div class="v">${escapeHtml(money.format(Number(payment.amount || 0)))}</div>
          <div class="muted" style="margin-top:6px">
            Outstanding Before: ${escapeHtml(money.format(Number(payment.receipt?.outstandingBefore || 0)))} &bull;
            Outstanding After: ${escapeHtml(money.format(Number(payment.receipt?.outstandingAfter || 0)))}
          </div>
        </div>

        <div class="btn">
          <button class="p" onclick="window.print()">Print / Save as PDF</button>
          <button class="s" onclick="window.close()">Close</button>
        </div>
      </div>
    </div>
  </body>
</html>`;

    const win = window.open('', '_blank', 'noopener,noreferrer,width=820,height=900');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const openClientDrawer = async (payment) => {
    const userId = payment.user?._id || null;
    const email = payment.user?.email || '';
    const name = payment.user?.name || '';
    if (!email && !userId) return;

    setDrawerOpen(true);
    setDrawerClient({ userId, email, name });
    setDrawerLoading(true);
    setDrawerError('');
    setDrawerPayments([]);
    setDrawerSummary(null);

    try {
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (filters.from) params.append('from', `${filters.from}T00:00:00.000`);
      if (filters.to) params.append('to', `${filters.to}T23:59:59.999`);
      const payRes = await api.get(`/payments/all?${params.toString()}`);
      setDrawerPayments(payRes.data?.payments || []);

      if (isCompany && userId) {
        const sParams = new URLSearchParams();
        sParams.append('userId', userId);
        if (filters.month) sParams.append('month', filters.month);
        if (filters.year) sParams.append('year', filters.year);
        if (filters.from) sParams.append('from', `${filters.from}T00:00:00.000`);
        if (filters.to) sParams.append('to', `${filters.to}T23:59:59.999`);
        const sumRes = await api.get(`/payments/company/summary?${sParams.toString()}`);
        setDrawerSummary(sumRes.data || null);
      }
    } catch (err) {
      console.error('Error loading client drawer:', err);
      setDrawerError(err?.response?.data?.error || 'Unable to load client details');
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerClient(null);
    setDrawerPayments([]);
    setDrawerSummary(null);
    setDrawerError('');
  };

  const monthlyData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const monthPayments = payments.filter((p) => p.month === i + 1);
        return {
          month: new Date(0, i).toLocaleString('default', { month: 'short' }),
          amount: monthPayments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0),
          count: monthPayments.length,
        };
      }),
    [payments]
  );

  const statusData = useMemo(
    () => [
      { name: 'Paid', value: stats.paidPayments, color: '#22c55e' },
      { name: 'Unpaid', value: stats.unpaidPayments, color: '#f43f5e' },
      { name: 'Pending', value: stats.pendingPayments, color: '#f59e0b' },
      { name: 'Failed', value: stats.failedPayments, color: '#ef4444' },
    ],
    [stats.paidPayments, stats.unpaidPayments, stats.pendingPayments, stats.failedPayments]
  );

  const trendData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const monthPayments = payments.filter((p) => p.month === i + 1);
        const paidAmount = monthPayments
          .filter((p) => p.status === 'paid')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
	        const unpaidAmount = monthPayments
	          .filter((p) => p.status !== 'paid')
	          .reduce((sum, p) => sum + (p.amount || 0), 0);
        return {
          month: new Date(0, i).toLocaleString('default', { month: 'short' }),
          paid: paidAmount,
          unpaid: unpaidAmount,
          total: paidAmount + unpaidAmount,
        };
      }),
    [payments]
  );

  const companyReceipts = useMemo(() => {
    if (isCompany) return [];
    const map = new Map();
    payments
      .filter((p) => p.status === 'paid')
      .forEach((payment) => {
        const companyId = payment.company?._id || payment.company || 'unknown';
        const companyName = payment.company?.name || 'Unknown company';
        const existing = map.get(companyId) || { companyId, companyName, amount: 0, count: 0 };
        existing.amount += Number(payment.amount || 0);
        existing.count += 1;
        map.set(companyId, existing);
      });

    return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [payments, isCompany]);

  const topClients = useMemo(() => {
    if (!isCompany) return [];
    const map = new Map();
    payments
      .filter((p) => p.status === 'paid')
      .forEach((payment) => {
        const userId = payment.user?._id || payment.user || 'unknown';
        const userEmail = payment.user?.email || 'Unknown email';
        const userName = payment.user?.name || userEmail;
        const existing = map.get(userId) || { userId, userName, userEmail, amount: 0, count: 0 };
        existing.amount += Number(payment.amount || 0);
        existing.count += 1;
        map.set(userId, existing);
      });

    return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, 10);
  }, [payments, isCompany]);

  const uniquePayers = useMemo(() => {
    const ids = new Set();
    payments
      .filter((p) => p.status === 'paid')
      .forEach((p) => {
        const userId = p.user?._id || p.user;
        if (userId) ids.add(String(userId));
      });
    return ids.size;
  }, [payments]);

  const thisMonthRevenue = useMemo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return payments
      .filter((p) => p.status === 'paid' && p.month === month && p.year === year)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const paidRate = stats.totalPayments ? Math.round((stats.paidPayments / stats.totalPayments) * 100) : 0;
  const chartTick = useMemo(() => ({ fontSize: 12, fill: '#475569' }), []);
  const tooltipStyles = useMemo(
    () => ({
      contentStyle: {
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
        color: '#0f172a',
        fontSize: '0.85rem',
      },
      labelStyle: { color: '#475569', fontWeight: 700, marginBottom: '0.25rem' },
      itemStyle: { color: '#0f172a' },
      cursor: { fill: 'rgba(59, 130, 246, 0.08)' },
    }),
    []
  );

  if (loading) {
    return (
      <div className="appay-page">
        <div className="container py-5 text-center">
          <div className="spinner-border appay-spinner" role="status">
            <span className="visually-hidden">Loading payments...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appay-page">
      <div className="container">
        <section className="appay-hero">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
						<p className="appay-kicker">Sompay PSP</p>
						<h1>
							<Wallet size={30} />
							{actorLabel} Payments Center
						</h1>
						<p>
							{isCompany
								? 'Track revenue, monitor payment status, and audit transactions in one workspace.'
								: 'View all transactions across all users and companies, plus live activity stats.'}
						</p>
					</motion.div>
          <div className="appay-hero-actions">
            <button type="button" className="appay-btn appay-btn-soft" onClick={exportData}>
              <Download size={16} />
              Export CSV
            </button>
            <button type="button" className="appay-btn appay-btn-soft" onClick={fetchPayments}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </section>

	        <section className="appay-stats-grid">
	          <motion.article className="appay-stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
	            <div className="appay-stat-head">
	              <span>{isCompany ? 'Total Received' : 'Total Revenue'}</span>
	              <DollarSign size={18} />
	            </div>
	            <strong>{money.format(stats.totalRevenue)}</strong>
	            <small>Across all filtered paid transactions</small>
	          </motion.article>

	          <motion.article className="appay-stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
	            <div className="appay-stat-head">
	              <span>Total Payments</span>
	              <BarChart size={18} />
	            </div>
	            <strong>{stats.totalPayments.toLocaleString()}</strong>
	            <small>Complete payment records</small>
	          </motion.article>

	          <motion.article className="appay-stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
	            <div className="appay-stat-head">
	              <span>Paid</span>
	              <CheckCircle size={18} />
	            </div>
	            <strong>{stats.paidPayments.toLocaleString()}</strong>
	            <small>{paidRate}% success rate</small>
	          </motion.article>

	          <motion.article className="appay-stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
	            <div className="appay-stat-head">
	              <span>Unpaid</span>
	              <XCircle size={18} />
	            </div>
	            <strong>{stats.unpaidPayments.toLocaleString()}</strong>
	            <small>Not settled</small>
	          </motion.article>

	          <motion.article className="appay-stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
	            <div className="appay-stat-head">
	              <span>Pending</span>
	              <Clock size={18} />
	            </div>
	            <strong>{stats.pendingPayments.toLocaleString()}</strong>
	            <small>Awaiting confirmation</small>
	          </motion.article>

	          <motion.article className="appay-stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
	            <div className="appay-stat-head">
	              <span>Failed</span>
	              <AlertTriangle size={18} />
	            </div>
	            <strong>{stats.failedPayments.toLocaleString()}</strong>
	            <small>Needs attention</small>
	          </motion.article>

	          <motion.article className="appay-stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
	            <div className="appay-stat-head">
	              <span>Unique Payers</span>
	              <User size={18} />
	            </div>
	            <strong>{uniquePayers.toLocaleString()}</strong>
	            <small>Paid at least once</small>
	          </motion.article>

	          <motion.article className="appay-stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
	            <div className="appay-stat-head">
	              <span>This Month</span>
	              <TrendingUp size={18} />
	            </div>
	            <strong>{money.format(thisMonthRevenue)}</strong>
	            <small>Paid revenue this month</small>
	          </motion.article>
	        </section>

	        {isCompany ? (
	          <section className="appay-card">
            <div className="appay-card-head appay-card-head-between">
              <h3>
                <AlertTriangle size={18} />
                Alerts & Invoices
              </h3>
              <button type="button" className="appay-btn appay-btn-soft" onClick={fetchSummary} disabled={summaryLoading}>
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {summaryError && <div className="appay-alert appay-alert-error">{summaryError}</div>}
            {summaryLoading && <div className="appay-alert">Loading summary…</div>}

            {summary && !summaryLoading ? (
              <div className="appay-invoice-grid">
                <div className="appay-invoice-kpis">
                  <div className="appay-kpi">
                    <div className="appay-kpi-label">Outstanding (This Month)</div>
                    <div className="appay-kpi-value">{money.format(Number(summary.alerts?.unpaidThisMonthOutstanding || 0))}</div>
                  </div>
                  <div className="appay-kpi">
                    <div className="appay-kpi-label">Failed Payments (30d)</div>
                    <div className="appay-kpi-value">{Number(summary.alerts?.failedPayments30d || 0).toLocaleString()}</div>
                  </div>
                  <div className="appay-kpi">
                    <div className="appay-kpi-label">Pending Payments (30d)</div>
                    <div className="appay-kpi-value">{Number(summary.alerts?.pendingPayments30d || 0).toLocaleString()}</div>
                  </div>
                </div>

                <div className="appay-invoice-table">
                  <div className="appay-card-head">
                    <h3>
                      <Calendar size={18} />
                      Due vs Paid (By Month)
                    </h3>
                  </div>
                  <div className="table-responsive">
                    <table className="table appay-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Total Due</th>
                          <th>Paid</th>
                          <th>Outstanding</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(summary.periods || []).slice(0, 12).map((p) => (
                          <tr key={`${p.year}-${p.month}`}>
                            <td>{p.month}/{p.year}</td>
                            <td>{money.format(Number(p.totalDue || 0))}</td>
                            <td>{money.format(Number(p.totalPaid || 0))}</td>
                            <td>{money.format(Number(p.totalOutstanding || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="appay-invoice-table">
                  <div className="appay-card-head">
                    <h3>Top Overdue Clients</h3>
                  </div>
                  {(summary.topOverdueClients || []).length === 0 ? (
                    <div style={{ color: '#475569' }}>No overdue clients found.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table appay-table">
                        <thead>
                          <tr>
                            <th>Client</th>
                            <th>Email</th>
                            <th>Outstanding</th>
                            <th>Overdue Months</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.topOverdueClients.map((c) => (
                            <tr key={c.userId}>
                              <td>{c.userName}</td>
                              <td>{c.userEmail}</td>
                              <td>{money.format(Number(c.outstandingTotal || 0))}</td>
                              <td>{Number(c.overduePeriods || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="appay-invoice-table">
                  <div className="appay-card-head">
                    <h3>Recent Failed Payments (30d)</h3>
                  </div>
                  {(summary.recentFailedPayments || []).length === 0 ? (
                    <div style={{ color: '#475569' }}>No failed payments in the last 30 days.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table appay-table">
                        <thead>
                          <tr>
                            <th>UUID</th>
                            <th>Client</th>
                            <th>Amount</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.recentFailedPayments.map((t) => (
                            <tr key={t.uuid}>
                              <td><code className="appay-uuid">{t.uuid}</code></td>
                              <td>{t.user?.email || t.user?.name || 'Unknown'}</td>
                              <td>{money.format(Number(t.amount || 0))}</td>
                              <td className="appay-date">{new Date(t.date).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

	        {isCompany ? (
	          <section className="appay-card">
	            <div className="appay-card-head">
	              <h3>Top Clients Paying (Paid)</h3>
	            </div>
	            {topClients.length === 0 ? (
	              <div style={{ color: 'rgba(203, 213, 225, 0.9)' }}>No paid transactions yet.</div>
	            ) : (
	              <div className="table-responsive">
	                <table className="table appay-table">
	                  <thead>
	                    <tr>
	                      <th>Client</th>
	                      <th>Email</th>
	                      <th>Paid Amount</th>
	                      <th>Paid Tx</th>
	                    </tr>
	                  </thead>
	                  <tbody>
	                    {topClients.map((row) => (
	                      <tr key={row.userId}>
	                        <td>{row.userName}</td>
	                        <td>{row.userEmail}</td>
	                        <td>{money.format(row.amount)}</td>
	                        <td>{row.count.toLocaleString()}</td>
	                      </tr>
	                    ))}
	                  </tbody>
	                </table>
	              </div>
	            )}
	          </section>
	        ) : isAdmin ? (
	          <section className="appay-card">
	            <div className="appay-card-head">
	              <h3>Top Companies Receiving (Paid)</h3>
	            </div>
	            {companyReceipts.length === 0 ? (
	              <div style={{ color: 'rgba(203, 213, 225, 0.9)' }}>No paid transactions yet.</div>
	            ) : (
	              <div className="table-responsive">
	                <table className="table appay-table">
	                  <thead>
	                    <tr>
	                      <th>Company</th>
	                      <th>Paid Amount</th>
	                      <th>Paid Tx</th>
	                    </tr>
	                  </thead>
	                  <tbody>
	                    {companyReceipts.map((row) => (
	                      <tr key={row.companyId}>
	                        <td>{row.companyName}</td>
	                        <td>{money.format(row.amount)}</td>
	                        <td>{row.count.toLocaleString()}</td>
	                      </tr>
	                    ))}
	                  </tbody>
	                </table>
	              </div>
	            )}
	          </section>
	        ) : null}

        <section className="appay-grid appay-grid-2">
          <article className="appay-card">
            <div className="appay-card-head">
              <h3>Monthly Revenue</h3>
            </div>
            <div className="appay-chart">
              <ResponsiveContainer width="100%" height={330}>
                <RechartsBar data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                  <XAxis dataKey="month" tick={chartTick} />
                  <YAxis tick={chartTick} tickFormatter={(value) => compact.format(value)} />
                  <Tooltip
                    formatter={(value) => [money.format(Number(value || 0)), 'Revenue']}
                    contentStyle={tooltipStyles.contentStyle}
                    labelStyle={tooltipStyles.labelStyle}
                    itemStyle={tooltipStyles.itemStyle}
                    cursor={tooltipStyles.cursor}
                  />
                  <Bar dataKey="amount" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </RechartsBar>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="appay-card">
            <div className="appay-card-head">
              <h3>Status Split</h3>
            </div>
            <div className="appay-chart">
              <ResponsiveContainer width="100%" height={330}>
                <RechartsPie>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={105}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`status-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyles.contentStyle}
                    labelStyle={tooltipStyles.labelStyle}
                    itemStyle={tooltipStyles.itemStyle}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="appay-card">
          <div className="appay-card-head">
            <h3>
              <TrendingUp size={18} />
              Payment Trend
            </h3>
          </div>
          <div className="appay-chart">
            <ResponsiveContainer width="100%" height={330}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                <XAxis dataKey="month" tick={chartTick} />
                <YAxis tick={chartTick} tickFormatter={(value) => compact.format(value)} />
                <Tooltip
                  formatter={(value) => [money.format(Number(value || 0)), 'Amount']}
                  contentStyle={tooltipStyles.contentStyle}
                  labelStyle={tooltipStyles.labelStyle}
                  itemStyle={tooltipStyles.itemStyle}
                  cursor={tooltipStyles.cursor}
                />
                <Line type="monotone" dataKey="paid" stroke="#22c55e" strokeWidth={2.6} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="unpaid" stroke="#f43f5e" strokeWidth={2.6} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="appay-card">
          <div className="appay-card-head appay-card-head-between">
            <h3>
              <Filter size={18} />
              Payment Filters
            </h3>
            <button type="button" className="appay-btn appay-btn-ghost" onClick={clearFilters}>
              Clear
            </button>
          </div>

          <div className="row g-3">
            <div className="col-lg-3 col-md-6">
              <label className="form-label">From</label>
              <input
                type="date"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className="form-control"
              />
            </div>

            <div className="col-lg-3 col-md-6">
              <label className="form-label">To</label>
              <input
                type="date"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="form-control"
              />
            </div>

            <div className="col-lg-2 col-md-4">
              <label className="form-label">Month</label>
              <select name="month" value={filters.month} onChange={handleFilterChange} className="form-select">
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-2 col-md-4">
              <label className="form-label">Year</label>
              <input
                type="number"
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                placeholder="e.g. 2026"
                className="form-control"
              />
            </div>

            <div className="col-lg-2 col-md-4">
              <label className="form-label">Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="form-select">
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="col-lg-3 col-md-6">
              <label className="form-label">Payment UUID</label>
              <input
                type="text"
                name="uuid"
                value={filters.uuid}
                onChange={handleFilterChange}
                placeholder="Search by payment UUID"
                className="form-control"
              />
            </div>

            <div className="col-lg-3 col-md-6">
              <label className="form-label">Client Email</label>
              <input
                type="email"
                name="email"
                value={filters.email}
                onChange={handleFilterChange}
                placeholder="Search by client email"
                className="form-control"
              />
            </div>
          </div>

          <div className="mt-3 appay-filter-actions">
            <div className="appay-presets">
              <button type="button" className="appay-btn appay-btn-soft" onClick={() => setPreset('today')}>
                Today
              </button>
              <button type="button" className="appay-btn appay-btn-soft" onClick={() => setPreset('last7')}>
                Last 7 days
              </button>
              <button type="button" className="appay-btn appay-btn-soft" onClick={() => setPreset('month')}>
                This month
              </button>
              <button type="button" className="appay-btn appay-btn-ghost" onClick={() => setPreset('clear')}>
                Clear dates
              </button>
            </div>
            <button type="button" onClick={applyFilters} className="appay-btn appay-btn-primary">
              <Search size={16} />
              Apply Filters
            </button>
          </div>
        </section>

        <section className="appay-card">
          <div className="appay-card-head">
            <h3>Payment Transactions ({payments.length})</h3>
          </div>

          {payments.length === 0 ? (
            <div className="appay-empty-state">
              <Wallet size={44} />
              <h5>No Payments Found</h5>
              <p>No payment transactions match your current filters.</p>
            </div>
          ) : (
            <div className="table-responsive appay-table-wrap">
              <table className="table appay-table">
                <thead>
                  <tr>
                    <th>UUID</th>
                    <th>Client</th>
                    <th>Period</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
	                  {payments.map((payment) => (
	                    <tr key={payment.uuid}>
	                      <td>
	                        <code className="appay-uuid" title={payment.uuid}>{payment.uuid}</code>
	                      </td>
	                      <td>
	                        <div className="appay-client">
	                          <span className="appay-client-icon">
	                            <User size={14} />
	                          </span>
	                          <button
	                            type="button"
	                            className="appay-link"
                            onClick={() => openClientDrawer(payment)}
                            title="View client details"
                          >
                            {payment.user?.email || 'N/A'}
                          </button>
                        </div>
                      </td>
                      <td>{payment.month}/{payment.year}</td>
                      <td>
                        <strong className="appay-amount">{money.format(payment.amount || 0)}</strong>
                      </td>
	                      <td>
	                        {(() => {
	                          const meta = statusMeta(payment.status);
	                          const Icon = meta.icon;
	                          return (
	                            <span className={`appay-status appay-status-${meta.key}`}>
	                              <Icon size={13} />
	                              {String(payment.status || meta.key)}
	                            </span>
	                          );
	                        })()}
	                      </td>
                      <td className="appay-date">{new Date(payment.date).toLocaleDateString()}</td>
                      <td>
                        <div className="appay-actions">
                          <button type="button" className="appay-btn appay-btn-soft" onClick={() => openReceipt(payment)}>
                            <FileText size={16} />
                            Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

	        {drawerOpen ? (
	          <div
	            className="appay-drawer-overlay"
	            role="dialog"
	            aria-modal="true"
	            onMouseDown={(e) => {
	              if (e.target === e.currentTarget) closeDrawer();
	            }}
	          >
	            <div className="appay-drawer">
	              <div className="appay-drawer-head">
	                <div className="appay-drawer-ident">
	                  <div className="appay-avatar" aria-hidden="true">
	                    {initials(drawerClient?.name || drawerClient?.email)}
	                  </div>
	                  <div>
	                    <div className="appay-drawer-title">{drawerClient?.name || 'Client'}</div>
	                    <div className="appay-drawer-sub">{drawerClient?.email}</div>
	                  </div>
	                </div>
	                <button
	                  type="button"
	                  className="appay-btn appay-btn-ghost"
	                  onClick={closeDrawer}
	                >
	                  <X size={16} />
	                  Close
	                </button>
              </div>

              {drawerLoading ? <div className="appay-alert">Loading…</div> : null}
              {drawerError ? <div className="appay-alert appay-alert-error">{drawerError}</div> : null}

              {!drawerLoading && drawerSummary ? (
                <div className="appay-drawer-kpis">
                  <div className="appay-kpi">
                    <div className="appay-kpi-label">Total Due</div>
                    <div className="appay-kpi-value">{money.format(Number(drawerSummary.totals?.totalDue || 0))}</div>
                  </div>
                  <div className="appay-kpi">
                    <div className="appay-kpi-label">Total Paid</div>
                    <div className="appay-kpi-value">{money.format(Number(drawerSummary.totals?.totalPaid || 0))}</div>
                  </div>
                  <div className="appay-kpi">
                    <div className="appay-kpi-label">Outstanding</div>
                    <div className="appay-kpi-value">{money.format(Number(drawerSummary.totals?.totalOutstanding || 0))}</div>
                  </div>
                </div>
              ) : null}

              {!drawerLoading && drawerSummary ? (
                <div className="appay-card" style={{ marginBottom: 0 }}>
                  <div className="appay-card-head">
                    <h3>Due vs Paid (Client)</h3>
                  </div>
                  <div className="table-responsive">
                    <table className="table appay-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Total Due</th>
                          <th>Paid</th>
                          <th>Outstanding</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(drawerSummary.periods || []).slice(0, 12).map((p) => (
                          <tr key={`${p.year}-${p.month}`}>
                            <td>{p.month}/{p.year}</td>
                            <td>{money.format(Number(p.totalDue || 0))}</td>
                            <td>{money.format(Number(p.totalPaid || 0))}</td>
                            <td>{money.format(Number(p.totalOutstanding || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {!drawerLoading ? (
                <div className="appay-card" style={{ marginTop: '0.9rem', marginBottom: 0 }}>
                  <div className="appay-card-head">
                    <h3>Payment History ({drawerPayments.length})</h3>
                  </div>
                  {drawerPayments.length === 0 ? (
                    <div style={{ color: '#475569' }}>No payments found for this client in the selected range.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table appay-table">
                        <thead>
                          <tr>
                            <th>UUID</th>
                            <th>Period</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
	                          {drawerPayments.map((p) => (
	                            <tr key={p.uuid}>
	                              <td><code className="appay-uuid" title={p.uuid}>{p.uuid}</code></td>
	                              <td>{p.month}/{p.year}</td>
	                              <td><strong className="appay-amount">{money.format(p.amount || 0)}</strong></td>
	                              <td>
	                                {(() => {
	                                  const meta = statusMeta(p.status);
	                                  const Icon = meta.icon;
	                                  return (
	                                    <span className={`appay-status appay-status-${meta.key}`}>
	                                      <Icon size={13} />
	                                      {String(p.status || meta.key)}
	                                    </span>
	                                  );
	                                })()}
	                              </td>
	                              <td className="appay-date">{new Date(p.date).toLocaleDateString()}</td>
	                              <td style={{ textAlign: 'right' }}>
                                <button type="button" className="appay-btn appay-btn-soft" onClick={() => openReceipt(p)}>
                                  <FileText size={16} />
                                  Receipt
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminPayments;
