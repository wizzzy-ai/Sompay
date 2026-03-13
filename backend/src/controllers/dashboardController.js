import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

export const getStats = async (req, res) => {
  try {
    const isUserDashboard = req.user?.userType === 'user';
    const transactionFilter = isUserDashboard ? { user: req.user.id } : {};
    const paidTransactionFilter = { ...transactionFilter, status: 'paid' };
    const pendingTransactionFilter = {
      ...transactionFilter,
      status: { $in: ['unpaid', 'pending'] }
    };

    // Get total revenue from paid payments
    const totalRevenueResult = await Transaction.aggregate([
      { $match: paidTransactionFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // Get total payments count
    const totalPayments = await Transaction.countDocuments(transactionFilter);

    // Get active clients count
    const activeClients = isUserDashboard
      ? 1
      : await User.countDocuments();

    // Get pending payments count
    const pendingPayments = await Transaction.countDocuments(pendingTransactionFilter);

    res.json({
      totalRevenue,
      totalPayments,
      activeClients,
      pendingPayments
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRevenueChart = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // 'month', 'week', 'year'

    let groupBy;
    let dateFormat;

    if (period === 'week') {
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
      dateFormat = '%Y-W%U';
    } else if (period === 'year') {
      groupBy = {
        year: { $year: '$createdAt' }
      };
      dateFormat = '%Y';
    } else { // month
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
      dateFormat = '%Y-%m';
    }

    const revenueData = await Transaction.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          period: {
            $dateToString: {
              format: dateFormat,
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: { $ifNull: ['$_id.month', 1] },
                  day: 1
                }
              }
            }
          },
          revenue: 1,
          count: 1
        }
      },
      { $sort: { period: 1 } }
    ]);

    res.json({ data: revenueData });
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
