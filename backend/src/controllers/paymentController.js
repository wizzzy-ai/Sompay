import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import MonthlyDue from '../models/MonthlyDue.js';
import MonthlyDueAdjustment from '../models/MonthlyDueAdjustment.js';

const getPeriodKey = (year, month) => `${year}-${month}`;

const sumAmounts = (items) => items.reduce((sum, item) => sum + Number(item?.amount || 0), 0);
const asString = (value) => String(value ?? '').trim();
const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());
const parseIsoDate = (value) => {
  if (!value) return null;
  const d = new Date(String(value));
  return isValidDate(d) ? d : null;
};

// Client: Get own payment history
export const getClientPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const month = req.query.month ? parseInt(req.query.month, 10) : null;
    const year = req.query.year ? parseInt(req.query.year, 10) : null;
    const statusFilter = req.query.status ? String(req.query.status).toLowerCase() : '';

    // Check if user is still assigned to a company
    const user = await User.findById(userId);
    if (!user || !user.company) {
      return res.json({ payments: [] });
    }

    const [payments, dues, adjustments] = await Promise.all([
      Transaction.find({ user: userId, company: user.company }).sort({ year: -1, month: -1, createdAt: -1 }),
      MonthlyDue.find({ company: user.company, user: userId }).select('month year amount notes updatedAt'),
      MonthlyDueAdjustment.find({ company: user.company, user: userId }).select('month year amount notes createdAt')
    ]);

    const duesByPeriod = new Map(dues.map((due) => [getPeriodKey(due.year, due.month), due]));
    const adjustmentsByPeriod = new Map();
    adjustments.forEach((item) => {
      const key = getPeriodKey(item.year, item.month);
      const list = adjustmentsByPeriod.get(key) || [];
      list.push(item);
      adjustmentsByPeriod.set(key, list);
    });

    const paymentsByPeriod = new Map();
    payments.forEach((payment) => {
      const key = getPeriodKey(payment.year, payment.month);
      const list = paymentsByPeriod.get(key) || [];
      list.push(payment);
      paymentsByPeriod.set(key, list);
    });

    const periodKeys = new Set([
      ...duesByPeriod.keys(),
      ...adjustmentsByPeriod.keys(),
      ...paymentsByPeriod.keys(),
    ]);

    const merged = [...periodKeys].map((key) => {
      const [periodYear, periodMonth] = key.split('-').map((x) => parseInt(x, 10));
      const due = duesByPeriod.get(key) || null;
      const periodAdjustments = adjustmentsByPeriod.get(key) || [];
      const periodPayments = paymentsByPeriod.get(key) || [];

      const baseAmount = due?.amount ?? 0;
      const extraTotal = sumAmounts(periodAdjustments);
      const totalDue = baseAmount + extraTotal;

      const paidPayments = periodPayments.filter((p) => p.status === 'paid');
      const totalPaid = sumAmounts(paidPayments);
      const outstanding = Math.max(0, totalDue - totalPaid);

      const paymentStatus =
        totalDue <= 0
          ? (periodPayments[0]?.status || 'unpaid')
          : outstanding <= 0
            ? 'paid'
            : totalPaid > 0
              ? 'pending'
              : 'unpaid';

      const latestPayment = periodPayments[0] || null;

      return {
        _id: latestPayment?._id || `period-${key}`,
        month: periodMonth,
        year: periodYear,
        amount: totalPaid > 0 ? totalPaid : totalDue,
        dueAmount: totalDue > 0 ? totalDue : null,
        baseDueAmount: due?.amount ?? null,
        extraChargeTotal: extraTotal || 0,
        outstanding,
        status: paymentStatus,
        paymentStatus,
        paymentDate: latestPayment?.date || latestPayment?.createdAt || null,
        createdAt: latestPayment?.createdAt || due?.updatedAt || null,
        notes: latestPayment?.metadata?.notes || due?.notes || null,
        uuid: latestPayment?.uuid || null,
        receipt: latestPayment?.receipt || null,
        paymentsCount: periodPayments.length,
      };
    });

    const formattedPayments = merged
      .filter((payment) => (month ? payment.month === month : true))
      .filter((payment) => (year ? payment.year === year : true))
      .filter((payment) => (statusFilter ? String(payment.paymentStatus).toLowerCase() === statusFilter : true))
      .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        if (b.month !== a.month) return b.month - a.month;
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

    res.json({ payments: formattedPayments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getMyDue = async (req, res) => {
  try {
    const userId = req.user.id;
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Month must be between 1 and 12' });
    }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Invalid year value' });
    }

    const user = await User.findById(userId).select('company');
    if (!user || !user.company) {
      return res.json({
        month,
        year,
        hasDue: false,
        dueAmount: null,
        paymentStatus: 'unpaid',
        totalOutstanding: 0,
        pendingMonths: 0,
        missedMonths: 0,
        dueItems: []
      });
    }

    const [dues, adjustments, payments] = await Promise.all([
      MonthlyDue.find({
        company: user.company,
        user: userId
      })
        .select('amount month year notes updatedAt')
        .sort({ year: 1, month: 1 }),
      MonthlyDueAdjustment.find({
        company: user.company,
        user: userId
      })
        .select('amount month year notes createdAt')
        .sort({ createdAt: -1 }),
      Transaction.find({ user: userId, company: user.company })
        .select('amount month year status createdAt')
        .sort({ year: -1, month: -1, createdAt: -1 })
    ]);

    const adjustmentsByPeriod = new Map();
    adjustments.forEach((item) => {
      const key = getPeriodKey(item.year, item.month);
      const list = adjustmentsByPeriod.get(key) || [];
      list.push(item);
      adjustmentsByPeriod.set(key, list);
    });

    const paymentsByPeriod = new Map();
    payments.forEach((payment) => {
      const key = getPeriodKey(payment.year, payment.month);
      const list = paymentsByPeriod.get(key) || [];
      list.push(payment);
      paymentsByPeriod.set(key, list);
    });

    const dueItems = dues.map((due) => {
      const key = getPeriodKey(due.year, due.month);
      const periodAdjustments = adjustmentsByPeriod.get(key) || [];
      const periodPayments = paymentsByPeriod.get(key) || [];

      const extraTotal = sumAmounts(periodAdjustments);
      const totalDue = Number(due.amount || 0) + extraTotal;

      const totalPaid = sumAmounts(periodPayments.filter((p) => p.status === 'paid'));
      const outstanding = Math.max(0, totalDue - totalPaid);

      const paymentStatus = outstanding <= 0 ? 'paid' : totalPaid > 0 ? 'pending' : 'unpaid';
      const latestPaidAt = periodPayments.find((p) => p.status === 'paid')?.createdAt ?? null;

      return {
        month: due.month,
        year: due.year,
        baseAmount: due.amount,
        extraTotal,
        totalDue,
        notes: due.notes ?? null,
        updatedAt: due.updatedAt,
        paymentStatus,
        paidAmount: totalPaid || null,
        paidAt: latestPaidAt,
        outstanding
      };
    });

    const currentDue = dueItems.find((item) => item.month === month && item.year === year) || null;
    const pendingItems = dueItems.filter((item) => item.paymentStatus !== 'paid');
    const totalOutstanding = pendingItems.reduce((sum, item) => sum + Number(item.outstanding || 0), 0);
    const missedMonths = pendingItems.filter(
      (item) => item.year < year || (item.year === year && item.month < month)
    ).length;
    const nextPendingDue = pendingItems[0] || null;
    const latestPaidItem = [...dueItems].reverse().find((item) => item.paymentStatus === 'paid') || null;

    return res.json({
      month: currentDue?.month ?? month,
      year: currentDue?.year ?? year,
      hasDue: !!currentDue,
      dueAmount: currentDue?.totalDue ?? null,
      notes: currentDue?.notes ?? null,
      paymentStatus: currentDue?.paymentStatus || 'unpaid',
      paidAmount: currentDue?.paidAmount ?? null,
      paidAt: currentDue?.paidAt ?? null,
      outstanding: currentDue?.outstanding ?? (currentDue?.totalDue ?? 0),
      baseDueAmount: currentDue?.baseAmount ?? null,
      extraChargeTotal: currentDue?.extraTotal ?? 0,
      totalOutstanding,
      pendingMonths: pendingItems.length,
      missedMonths,
      nextPendingDue,
      latestPaidItem,
      dueItems
    });
  } catch (err) {
    console.error('Error fetching due:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Client: Initiate payment
export const initiatePayment = async (req, res) => {
  try {
    console.log('Initiate payment request:', req.body);
    console.log('User ID:', req.user.id);
    const { month, amount, year } = req.body;
    const userId = req.user.id;
    const paymentMonth = parseInt(month, 10);
    const paymentYear = parseInt(year, 10) || new Date().getFullYear();

    if (!Number.isInteger(paymentMonth) || paymentMonth < 1 || paymentMonth > 12) {
      return res.status(400).json({ error: 'Month must be between 1 and 12' });
    }
    if (!Number.isInteger(paymentYear) || paymentYear < 2000 || paymentYear > 2100) {
      return res.status(400).json({ error: 'Invalid year value' });
    }

    // Get user details
    const user = await User.findById(userId);
    console.log('User found:', !!user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log('User company:', user.company);
    if (!user.company) {
      return res.status(403).json({ error: 'No company assigned yet. Request a company and wait for approval.' });
    }
    if (user.company && !mongoose.Types.ObjectId.isValid(user.company)) {
      return res.status(400).json({ error: "User has invalid company ID" });
    }

    const [due, adjustmentItems, paidPayments] = await Promise.all([
      MonthlyDue.findOne({
        company: user.company,
        user: userId,
        month: paymentMonth,
        year: paymentYear
      }).select('amount'),
      MonthlyDueAdjustment.find({
        company: user.company,
        user: userId,
        month: paymentMonth,
        year: paymentYear
      }).select('amount'),
      Transaction.find({
        user: userId,
        company: user.company,
        month: paymentMonth,
        year: paymentYear,
        status: 'paid'
      }).select('amount')
    ]);

    if (!due) {
      return res.status(400).json({ error: 'No base due amount has been assigned for this month yet' });
    }

    const baseDue = Number(due.amount || 0);
    const extraTotal = sumAmounts(adjustmentItems);
    const totalDue = baseDue + extraTotal;
    const totalPaid = sumAmounts(paidPayments);
    const outstandingBefore = Math.max(0, totalDue - totalPaid);

    if (outstandingBefore <= 0) {
      return res.status(400).json({ error: 'This month is already fully paid' });
    }

    const paymentAmount = parseFloat(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }
    if (paymentAmount - outstandingBefore > 0.001) {
      return res.status(400).json({ error: `Payment cannot exceed outstanding balance (${outstandingBefore})` });
    }

    const uuid = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Creating payment with:', { user: userId, month: paymentMonth, year: paymentYear, amount: paymentAmount, uuid });

    const payment = await Transaction.create({
      company: user.company,
      user: userId,
      month: paymentMonth,
      year: paymentYear,
      amount: paymentAmount,
      status: 'paid',
      uuid,
      receipt: {
        name: user.name,
        accountNo: `ACC-${userId}`,
        outstandingBefore,
        requiredAmount: totalDue,
        outstandingAfter: Math.max(0, outstandingBefore - paymentAmount),
        paidOn: new Date()
      }
    });

    console.log('Payment created successfully');
    console.log('Sending success response');
    res.json({ message: "Payment initiated successfully", payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Admin: Get all payments with filters
export const getAllPayments = async (req, res) => {
  try {
    if (req.user?.userType === 'user') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { month, year, uuid, email, status, companyId: companyIdParam, from, to } = req.query;
    const isCompanyAccount = req.user?.userType === 'company' || req.user?.roles?.includes('company');
    const isAdminAccount = req.user?.userType === 'admin' || req.user?.roles?.includes('admin');
    const companyId = isCompanyAccount ? req.user?.companyId : null;

    let filter = {};

    if (isCompanyAccount && companyId) {
      filter.company = companyId;
    }

    if (isAdminAccount && companyIdParam) {
      filter.company = companyIdParam;
    }

    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (uuid) filter.uuid = uuid;
    if (status) filter.status = String(status).toLowerCase();

    const fromDate = parseIsoDate(from);
    const toDate = parseIsoDate(to);
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = fromDate;
      if (toDate) filter.date.$lte = toDate;
    }

    if (email) {
      const user = await User.findOne({ email });
      if (user) {
        if (companyId && (!user.company || user.company.toString() !== String(companyId))) {
          return res.json({ payments: [] });
        }
        filter.user = user._id;
      } else {
        return res.json({ payments: [] });
      }
    }

    const payments = await Transaction.find(filter)
      .populate('user', 'name email')
      .populate('company', 'name email')
      .sort({ year: -1, month: -1, createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const parseMonthYearFilters = (query) => {
  const month = query.month ? parseInt(query.month, 10) : null;
  const year = query.year ? parseInt(query.year, 10) : null;
  const monthOk = Number.isInteger(month) && month >= 1 && month <= 12 ? month : null;
  const yearOk = Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null;
  return { month: monthOk, year: yearOk };
};

const buildRecentPeriods = (count = 12) => {
  const periods = [];
  const now = new Date();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();
  for (let i = 0; i < count; i += 1) {
    periods.push({ year, month });
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }
  return periods;
};

// Company: summary of dues vs payments + alerts
export const getCompanyPaymentsSummary = async (req, res) => {
  try {
    const isCompanyAccount = req.user?.userType === 'company' || req.user?.roles?.includes('company');
    if (!isCompanyAccount) return res.status(403).json({ error: 'Access denied.' });

    const companyId = req.user?.companyId;
    if (!companyId) return res.status(400).json({ error: 'Company scope missing.' });

    const { month, year } = parseMonthYearFilters(req.query);
    const userId = asString(req.query.userId) || null;
    const fromDate = parseIsoDate(req.query.from);
    const toDate = parseIsoDate(req.query.to);

    const dueFilter = { company: companyId };
    const adjFilter = { company: companyId };
    const txFilter = { company: companyId };

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      dueFilter.user = userId;
      adjFilter.user = userId;
      txFilter.user = userId;
    }

    if (year) {
      dueFilter.year = year;
      adjFilter.year = year;
      txFilter.year = year;
    }
    if (month) {
      dueFilter.month = month;
      adjFilter.month = month;
      txFilter.month = month;
    }
    if (fromDate || toDate) {
      txFilter.date = {};
      if (fromDate) txFilter.date.$gte = fromDate;
      if (toDate) txFilter.date.$lte = toDate;
    }

    const [dues, adjustments, transactions] = await Promise.all([
      MonthlyDue.find(dueFilter).select('user month year amount').lean(),
      MonthlyDueAdjustment.find(adjFilter).select('user month year amount').lean(),
      Transaction.find(txFilter)
        .select('user month year amount status date uuid paymentMethod receipt createdAt')
        .populate('user', 'name email')
        .sort({ year: -1, month: -1, createdAt: -1 })
        .lean(),
    ]);

    const periodMap = new Map();
    const ensurePeriod = (periodYear, periodMonth) => {
      const key = getPeriodKey(periodYear, periodMonth);
      const existing =
        periodMap.get(key) || {
          year: periodYear,
          month: periodMonth,
          baseDueTotal: 0,
          adjustmentTotal: 0,
          totalDue: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          paidTxCount: 0,
          failedTxCount: 0,
          pendingTxCount: 0,
        };
      periodMap.set(key, existing);
      return existing;
    };

    dues.forEach((due) => {
      const item = ensurePeriod(due.year, due.month);
      item.baseDueTotal += Number(due.amount || 0);
    });

    adjustments.forEach((adj) => {
      const item = ensurePeriod(adj.year, adj.month);
      item.adjustmentTotal += Number(adj.amount || 0);
    });

    transactions.forEach((tx) => {
      const item = ensurePeriod(tx.year, tx.month);
      if (tx.status === 'paid') {
        item.totalPaid += Number(tx.amount || 0);
        item.paidTxCount += 1;
      } else if (tx.status === 'failed') {
        item.failedTxCount += 1;
      } else if (tx.status === 'pending') {
        item.pendingTxCount += 1;
      }
    });

    // Ensure we always have some periods to show
    if (periodMap.size === 0) {
      buildRecentPeriods(12).forEach((p) => ensurePeriod(p.year, p.month));
    }

    const periods = [...periodMap.values()]
      .map((p) => {
        const totalDue = Number(p.baseDueTotal || 0) + Number(p.adjustmentTotal || 0);
        const totalPaid = Number(p.totalPaid || 0);
        const totalOutstanding = Math.max(0, totalDue - totalPaid);
        return {
          ...p,
          totalDue,
          totalPaid,
          totalOutstanding,
        };
      })
      .sort((a, b) => (b.year - a.year) || (b.month - a.month))
      .slice(0, 24);

    // Per-user overdue totals (across all periods in scope)
    const userTotals = new Map();
    const ensureUser = (id, fallback) => {
      const key = String(id || 'unknown');
      const existing =
        userTotals.get(key) || {
          userId: key,
          userName: fallback?.name || 'Unknown user',
          userEmail: fallback?.email || 'Unknown email',
          outstandingTotal: 0,
          overduePeriods: 0,
        };
      userTotals.set(key, existing);
      return existing;
    };

    const dueByUserPeriod = new Map(); // key: userId|period -> dueTotal
    dues.forEach((due) => {
      const key = `${String(due.user)}|${getPeriodKey(due.year, due.month)}`;
      const next = Number(dueByUserPeriod.get(key) || 0) + Number(due.amount || 0);
      dueByUserPeriod.set(key, next);
    });
    adjustments.forEach((adj) => {
      const key = `${String(adj.user)}|${getPeriodKey(adj.year, adj.month)}`;
      const next = Number(dueByUserPeriod.get(key) || 0) + Number(adj.amount || 0);
      dueByUserPeriod.set(key, next);
    });

    const paidByUserPeriod = new Map();
    transactions
      .filter((t) => t.status === 'paid')
      .forEach((t) => {
        const uid = String(t.user?._id || t.user);
        const key = `${uid}|${getPeriodKey(t.year, t.month)}`;
        const next = Number(paidByUserPeriod.get(key) || 0) + Number(t.amount || 0);
        paidByUserPeriod.set(key, next);
      });

    const keys = new Set([...dueByUserPeriod.keys(), ...paidByUserPeriod.keys()]);
    keys.forEach((key) => {
      const [uid, periodKey] = key.split('|');
      const dueTotal = Number(dueByUserPeriod.get(key) || 0);
      const paidTotal = Number(paidByUserPeriod.get(key) || 0);
      const outstanding = Math.max(0, dueTotal - paidTotal);
      if (outstanding <= 0) return;

      // Get user info from any transaction populate if possible
      const anyTx = transactions.find((t) => String(t.user?._id || t.user) === uid);
      const info = anyTx?.user || null;
      const entry = ensureUser(uid, info);
      entry.outstandingTotal += outstanding;
      entry.overduePeriods += 1;
    });

    const topOverdueClients = [...userTotals.values()]
      .sort((a, b) => b.outstandingTotal - a.outstandingTotal)
      .slice(0, 8);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentPeriod = periods.find((p) => p.month === currentMonth && p.year === currentYear) || null;

    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const txDate = (t) => {
      const d = t?.date || t?.createdAt;
      if (!d) return null;
      const parsed = new Date(d);
      return isValidDate(parsed) ? parsed : null;
    };
    const failedPayments30d = transactions.filter((t) => t.status === 'failed' && txDate(t) && txDate(t) >= since30d);
    const pendingPayments30d = transactions.filter((t) => t.status === 'pending' && txDate(t) && txDate(t) >= since30d);

    res.json({
      periods,
      totals: {
        totalDue: periods.reduce((sum, p) => sum + Number(p.totalDue || 0), 0),
        totalPaid: periods.reduce((sum, p) => sum + Number(p.totalPaid || 0), 0),
        totalOutstanding: periods.reduce((sum, p) => sum + Number(p.totalOutstanding || 0), 0),
      },
      alerts: {
        unpaidThisMonthOutstanding: currentPeriod?.totalOutstanding ?? 0,
        failedPayments30d: failedPayments30d.length,
        pendingPayments30d: pendingPayments30d.length,
      },
      topOverdueClients,
      recentFailedPayments: failedPayments30d.slice(0, 10).map((t) => ({
        uuid: t.uuid,
        amount: t.amount,
        date: t.date || t.createdAt,
        user: t.user ? { name: t.user.name, email: t.user.email } : null,
      })),
    });
  } catch (err) {
    console.error('getCompanyPaymentsSummary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get recent payments (for dashboard)
export const getRecentPayments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const filter =
      req.user?.userType === 'user'
        ? { user: req.user.id }
        : req.user?.companyId
          ? { company: req.user.companyId }
          : {};
    const payments = await Transaction.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Format for dashboard
    const formattedPayments = payments.map(payment => ({
      id: payment._id,
      clientName: payment.user?.name || 'Unknown',
      period: `${payment.month}/${payment.year}`,
      amount: payment.amount,
      status: payment.status,
      date: payment.createdAt
    }));

    res.json({ payments: formattedPayments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
