import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Company from '../models/Company.js';
import Admin from '../models/Admin.js';
import Message from '../models/Message.js';
import MonthlyDue from '../models/MonthlyDue.js';
import MonthlyDueAdjustment from '../models/MonthlyDueAdjustment.js';
import CompanyJoinRequest from '../models/CompanyJoinRequest.js';
import { createUserNotification, formatMonthYear } from '../utils/notificationService.js';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import winston from 'winston';
import { sendVerificationEmail } from '../utils/emailService.js';

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'admin-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'admin.log', level: 'info' }),
    new winston.transports.File({ filename: 'admin-error.log', level: 'error' }),
  ],
});

// Validation schemas
const companyRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match'
  }),
  contactPerson: Joi.string().min(2).max(100).trim().required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(20).required(),
  address: Joi.string().min(10).max(500).trim().required(),
  description: Joi.string().max(1000).trim().optional()
});

export const getDashboardStats = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Total Clients for this company
    const totalClients = await User.countDocuments({ company: companyId });

    // Active Clients (verified users) for this company
    const activeClients = await User.countDocuments({
      company: companyId,
      isVerified: true
    });

    // Monthly Revenue (sum of paid transactions for current month) for this company
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthlyRevenueResult = await Transaction.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          month: currentMonth,
          year: currentYear,
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const monthlyPayments = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;

    // Pending Registrations (unverified users) for this company
    const pendingRegistrations = await User.countDocuments({
      company: companyId,
      isVerified: false
    });

    res.json({
      totalClients,
      activeClients,
      monthlyPayments,
      pendingRegistrations
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Get recent user registrations and transactions for this company
    const recentUsers = await User.find({ company: companyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt isVerified');

    const recentTransactions = await Transaction.find({ company: companyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .select('user amount status createdAt uuid transactionType');

    const activities = [
      ...recentUsers.map(user => ({
        type: 'registration',
        message: `${user.name} registered`,
        timestamp: user.createdAt,
        data: user
      })),
      ...recentTransactions.map(transaction => ({
        type: 'transaction',
        message: `${transaction.transactionType} ${transaction.uuid} - ${transaction.status}`,
        timestamp: transaction.createdAt,
        data: transaction
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    res.json({ activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllClients = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const clients = await User.find({ company: companyId }).select('name email isVerified createdAt');
    res.json({ clients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const approveRegistration = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Ensure user belongs to admin's company
    if (user.company.toString() !== companyId.toString()) {
      return res.status(403).json({ error: "Access denied. User does not belong to your company." });
    }

    user.isVerified = true;
    await user.save();

    res.json({ message: "User approved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateClientStatus = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { clientId } = req.params;
    const { status } = req.body;

    const user = await User.findById(clientId);
    if (!user) return res.status(404).json({ error: "Client not found" });

    // Ensure user belongs to admin's company
    if (user.company.toString() !== companyId.toString()) {
      return res.status(403).json({ error: "Access denied. User does not belong to your company." });
    }

    user.status = status;
    await user.save();

    res.json({ message: "Client status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const isPlatformAdmin = req.user?.userType === 'admin';
    const companyId = req.user.companyId;

    const filter = isPlatformAdmin ? {} : { company: new mongoose.Types.ObjectId(companyId) };

    const users = await User.find(filter)
      .populate('company', 'name email')
      .select('name email roles status company createdAt updatedAt')
      .sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getUserMonthlyDue = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { userId } = req.params;
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    const user = await User.findById(userId).select('company');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.company || user.company.toString() !== companyId.toString()) {
      return res.status(403).json({ error: 'Access denied. User does not belong to your company.' });
    }

    if (Number.isInteger(month) && Number.isInteger(year)) {
      const [due, adjustments] = await Promise.all([
        MonthlyDue.findOne({
          company: companyId,
          user: userId,
          month,
          year
        }).select('month year amount notes updatedAt'),
        MonthlyDueAdjustment.find({
          company: companyId,
          user: userId,
          month,
          year
        })
          .sort({ createdAt: -1 })
          .select('amount notes createdAt createdBy createdByModel')
          .limit(200)
      ]);

      const baseAmount = due?.amount ?? 0;
      const extraTotal = adjustments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const totalDue = baseAmount + extraTotal;

      return res.json({
        due,
        adjustments,
        summary: {
          baseAmount,
          extraTotal,
          totalDue
        }
      });
    }

    const dues = await MonthlyDue.find({ company: companyId, user: userId })
      .sort({ year: -1, month: -1 })
      .limit(24)
      .select('month year amount notes updatedAt');

    return res.json({ dues });
  } catch (err) {
    console.error('Error fetching monthly due:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const addUserMonthlyDueAdjustment = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { userId } = req.params;
    const { month, year, amount, notes } = req.body;

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);
    const parsedAmount = Number(amount);

    if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ error: 'Month must be between 1 and 12' });
    }
    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      return res.status(400).json({ error: 'Invalid year value' });
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const user = await User.findById(userId).select('company');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.company || user.company.toString() !== companyId.toString()) {
      return res.status(403).json({ error: 'Access denied. User does not belong to your company.' });
    }

    const assignedByModel = req.user.roles?.includes('company') ? 'Company' : 'Admin';

    const adjustment = await MonthlyDueAdjustment.create({
      company: companyId,
      user: userId,
      month: parsedMonth,
      year: parsedYear,
      amount: parsedAmount,
      notes: notes || null,
      createdBy: req.user.id,
      createdByModel: assignedByModel
    });

    await createUserNotification({
      userId,
      type: 'payment_status',
      title: 'Extra charge added',
      message: `An extra charge of ₦${parsedAmount.toLocaleString('en-NG')} was added for ${formatMonthYear({ month: parsedMonth, year: parsedYear })}.`,
      metadata: {
        event: 'extra_charge',
        companyId: String(companyId),
        month: parsedMonth,
        year: parsedYear,
        amount: parsedAmount,
        adjustmentId: String(adjustment._id),
        notes: notes || null,
      },
      dedupeKey: `extra_charge:${adjustment._id}`,
    });

    return res.json({ message: 'Extra charge added successfully', adjustment });
  } catch (err) {
    console.error('Error adding extra charge:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getCompanyJoinRequests = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const status = String(req.query.status || 'pending').toLowerCase();

    const filter = { company: companyId };
    if (status && ['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      filter.status = status;
    }

    const requests = await CompanyJoinRequest.find(filter)
      .populate('user', 'name email status company createdAt')
      .sort({ createdAt: -1 })
      .limit(300);

    res.json({
      requests: requests.map((r) => ({
        id: r._id,
        status: r.status,
        message: r.message || null,
        createdAt: r.createdAt,
        decidedAt: r.decidedAt,
        user: r.user
          ? {
              id: r.user._id,
              name: r.user.name,
              email: r.user.email,
              status: r.user.status,
              companyId: r.user.company || null,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error('Error fetching join requests:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const approveCompanyJoinRequest = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { requestId } = req.params;

    const request = await CompanyJoinRequest.findById(requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (String(request.company) !== String(companyId)) return res.status(403).json({ error: 'Access denied' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request is not pending' });

    const user = await User.findById(request.user).select('company status');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.company) return res.status(400).json({ error: 'User is already assigned to a company' });

    user.company = companyId;
    if (user.status === 'pending') user.status = 'active';
    await user.save();

    const decidedByModel = req.user.roles?.includes('company') ? 'Company' : 'Admin';
    request.status = 'approved';
    request.decidedAt = new Date();
    request.decidedBy = req.user.id;
    request.decidedByModel = decidedByModel;
    await request.save();

    await createUserNotification({
      userId: request.user,
      type: 'system',
      title: 'Company request approved',
      message: 'Your request to join the company was approved. You can now access payments and your dashboard.',
      metadata: {
        event: 'company_join_approved',
        companyId: String(companyId),
        requestId: String(request._id),
      },
      dedupeKey: `company_join_approved:${request._id}`,
    });

    res.json({ message: 'User accepted', requestId: request._id });
  } catch (err) {
    console.error('Error approving join request:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const rejectCompanyJoinRequest = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { requestId } = req.params;

    const request = await CompanyJoinRequest.findById(requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (String(request.company) !== String(companyId)) return res.status(403).json({ error: 'Access denied' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request is not pending' });

    const decidedByModel = req.user.roles?.includes('company') ? 'Company' : 'Admin';
    request.status = 'rejected';
    request.decidedAt = new Date();
    request.decidedBy = req.user.id;
    request.decidedByModel = decidedByModel;
    await request.save();

    await createUserNotification({
      userId: request.user,
      type: 'system',
      title: 'Company request rejected',
      message: 'Your request to join the company was rejected. Contact the company/admin if you think this is a mistake.',
      metadata: {
        event: 'company_join_rejected',
        companyId: String(companyId),
        requestId: String(request._id),
      },
      dedupeKey: `company_join_rejected:${request._id}`,
    });

    res.json({ message: 'Request rejected', requestId: request._id });
  } catch (err) {
    console.error('Error rejecting join request:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const setUserMonthlyDue = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { userId } = req.params;
    const { month, year, amount, notes } = req.body;

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);
    const parsedAmount = Number(amount);

    if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ error: 'Month must be between 1 and 12' });
    }
    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      return res.status(400).json({ error: 'Invalid year value' });
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const user = await User.findById(userId).select('company');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.company || user.company.toString() !== companyId.toString()) {
      return res.status(403).json({ error: 'Access denied. User does not belong to your company.' });
    }

    const assignedByModel = req.user.roles?.includes('company') ? 'Company' : 'Admin';

    const updatedDue = await MonthlyDue.findOneAndUpdate(
      { company: companyId, user: userId, month: parsedMonth, year: parsedYear },
      {
        company: companyId,
        user: userId,
        month: parsedMonth,
        year: parsedYear,
        amount: parsedAmount,
        notes: notes || null,
        assignedBy: req.user.id,
        assignedByModel
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).select('month year amount notes updatedAt');

    await createUserNotification({
      userId,
      type: 'payment_status',
      title: 'Monthly payment due',
      message: `Your monthly due for ${formatMonthYear({ month: parsedMonth, year: parsedYear })} is ₦${parsedAmount.toLocaleString('en-NG')}.`,
      metadata: {
        event: 'monthly_due_set',
        companyId: String(companyId),
        month: parsedMonth,
        year: parsedYear,
        amount: parsedAmount,
        dueId: String(updatedDue._id),
        notes: notes || null,
      },
      dedupeKey: `monthly_due_set:${updatedDue._id}`,
    });

    return res.json({
      message: 'Monthly due set successfully',
      due: updatedDue
    });
  } catch (err) {
    console.error('Error setting monthly due:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getCompanyMonthlyDues = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    const filter = { company: companyId };
    if (Number.isInteger(month) && month >= 1 && month <= 12) filter.month = month;
    if (Number.isInteger(year) && year >= 2000 && year <= 2100) filter.year = year;

    const dues = await MonthlyDue.find(filter)
      .populate('user', 'name email')
      .sort({ year: -1, month: -1, updatedAt: -1 })
      .limit(500);

    return res.json({
      dues: dues.map((due) => ({
        id: due._id,
        userId: due.user?._id || null,
        userName: due.user?.name || 'Unknown user',
        userEmail: due.user?.email || 'No email',
        month: due.month,
        year: due.year,
        amount: due.amount,
        notes: due.notes || null,
        updatedAt: due.updatedAt
      }))
    });
  } catch (err) {
    console.error('Error fetching company monthly dues:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Ensure user belongs to admin's company
    if (user.company.toString() !== companyId.toString()) {
      return res.status(403).json({ error: "Access denied. User does not belong to your company." });
    }

    user.roles = [role]; // Assuming single role for simplicity
    await user.save();

    res.json({ message: "User role updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const isPlatformAdmin = req.user?.userType === 'admin';
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Company-scoped admins can only act within their company; platform admins can act globally.
    if (!isPlatformAdmin && user.company?.toString() !== companyId.toString()) {
      return res.status(403).json({ error: "Access denied. User does not belong to your company." });
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const isPlatformAdmin = req.user?.userType === 'admin';
    const { userId } = req.params;
    const status = String(req.body?.status || '').toLowerCase();
    const allowed = ['active', 'inactive', 'pending'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Company-scoped admins can only act within their company; platform admins can act globally.
    if (!isPlatformAdmin && user.company?.toString() !== companyId?.toString()) {
      return res.status(403).json({ error: 'Access denied. User does not belong to your company.' });
    }

    user.status = status;
    await user.save();

    return res.json({ message: 'User status updated successfully', user });
  } catch (err) {
    console.error('Error updating user status:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const updateUserCompany = async (req, res) => {
  try {
    const { userId, companyId: newCompanyId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // If companyId is null, we're removing the user from the company
    if (newCompanyId === 'null') {
      return res.status(403).json({ error: "Only company accounts can remove users from a company." });
    }

    // Check if new company exists
    const company = await Company.findById(newCompanyId);
    if (!company) return res.status(404).json({ error: "Company not found" });

    // Update user's company with proper ObjectId
    user.company = new mongoose.Types.ObjectId(newCompanyId);
    await user.save();

    res.json({ message: "User company updated successfully", user });
  } catch (err) {
    console.error('Error updating user company:', err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllUsersInDatabase = async (req, res) => {
  try {
    const users = await User.find({}).select('name email roles isVerified createdAt updatedAt company');
    res.json({ users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Company management functions
export const createCompany = async (req, res) => {
  try {
    const { name, email, description, phone, address } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ error: "Company with this email already exists" });
    }

    const company = new Company({
      name,
      email,
      description,
      phone,
      address
    });

    await company.save();

    res.status(201).json({
      message: "Company created successfully",
      company: {
        id: company._id,
        name: company.name,
        email: company.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().select('name email description phone address isActive createdAt');
    res.json({ companies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const removeUserFromCompany = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { userId } = req.params;

    const user = await User.findById(userId).select('company');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.company || user.company.toString() !== companyId.toString()) {
      return res.status(403).json({ error: 'Access denied. User does not belong to your company.' });
    }

    user.company = null;
    await user.save();

    return res.json({ message: 'User removed from company successfully' });
  } catch (err) {
    console.error('Error removing user from company:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const updateCompanyStatus = async (req, res) => {
  try {
    const { companyId } = req.params;
    const isActive = req.body?.isActive;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    company.isActive = isActive;
    await company.save();

    return res.json({
      message: `Company ${isActive ? 'activated' : 'suspended'} successfully`,
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
        isActive: company.isActive
      }
    });
  } catch (err) {
    console.error('Error updating company status:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId).select('_id name email');
    if (!company) return res.status(404).json({ error: 'Company not found' });

    await Promise.all([
      Admin.deleteMany({ company: company._id }),
      User.updateMany({ company: company._id }, { $set: { company: null } }),
      Transaction.deleteMany({ company: company._id }),
      MonthlyDue.deleteMany({ company: company._id }),
      MonthlyDueAdjustment.deleteMany({ company: company._id }),
      CompanyJoinRequest.deleteMany({ company: company._id }),
    ]);

    await Company.deleteOne({ _id: company._id });

    return res.json({ message: 'Company deleted successfully' });
  } catch (err) {
    console.error('Error deleting company:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getOnlineStats = async (req, res) => {
  try {
    const minutes = Math.max(1, parseInt(req.query.minutes, 10) || 5);
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const [usersTotal, usersOnline, companiesTotal, companiesOnline] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ lastSeenAt: { $gte: since } }),
      Company.countDocuments({}),
      Company.countDocuments({ lastSeenAt: { $gte: since } }),
    ]);

    return res.json({
      windowMinutes: minutes,
      users: {
        total: usersTotal,
        online: usersOnline,
        offline: Math.max(usersTotal - usersOnline, 0),
      },
      companies: {
        total: companiesTotal,
        online: companiesOnline,
        offline: Math.max(companiesTotal - companiesOnline, 0),
      }
    });
  } catch (err) {
    console.error('Error fetching online stats:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Admin management functions
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, companyId } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin with this email already exists" });
    }

    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const admin = new Admin({
      name,
      email,
      password,
      company: companyId
    });

    await admin.save();

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        company: admin.company
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    if (admin.verificationOtp !== otp || admin.verificationOtpExpires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    admin.isVerified = true;
    admin.verificationOtp = null;
    admin.verificationOtpExpires = null;
    await admin.save();

    res.json({ message: "Admin account verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .populate('company', 'name email')
      .select('name email company createdAt');
    res.json({ admins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const createClient = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { firstName, lastName, email, phone, status } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const user = new User({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      phone,
      status,
      company: companyId,
      roles: ['client']
    });

    await user.save();

    res.status(201).json({
      message: "Client created successfully",
      client: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        status: user.status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Company verification function
export const verifyCompanyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    // Find company by email
    const company = await Company.findOne({ email: email.toLowerCase() });
    if (!company) {
      logger.warn(`Company verification attempt for non-existent email: ${email}`);
      return res.status(404).json({ error: "Company not found" });
    }

    // Check if already verified
    if (company.isVerified) {
      return res.status(400).json({ error: "Company is already verified" });
    }

    // Check OTP validity
    if (company.verificationOtp !== otp || company.verificationOtpExpires < Date.now()) {
      logger.warn(`Invalid or expired OTP for company: ${email}`);
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Verify company
    company.isVerified = true;
    company.verificationOtp = null;
    company.verificationOtpExpires = null;
    await company.save();

    // Also verify the admin account
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (admin) {
      admin.isVerified = true;
      admin.verificationOtp = null;
      admin.verificationOtpExpires = null;
      await admin.save();
    }

    logger.info(`Company verified successfully: ${company.name} (${email})`);

    res.json({
      message: "Company account verified successfully! You can now login as a company.",
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
        isVerified: true
      }
    });
  } catch (err) {
    logger.error(`Company verification error for ${req.body.email}: ${err.message}`);
    res.status(500).json({ error: "Server error during verification" });
  }
};

// Company self-registration (creates company and admin with enhanced security)
export const registerCompany = async (req, res) => {
	  try {
    // Validate input data
    const { error, value } = companyRegistrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn(`Company registration validation failed: ${error.details.map(d => d.message).join(', ')}`);
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map(d => d.message)
      });
    }

	    const { name, email, password, contactPerson, phone, address, description } = value;
	    const normalizedEmail = email.toLowerCase().trim();

	    // Check if company email already exists
	    const [existingCompany, existingAdmin, existingUser] = await Promise.all([
	      Company.findOne({ email: normalizedEmail }),
	      Admin.findOne({ email: normalizedEmail }),
	      User.findOne({ email: normalizedEmail }),
	    ]);
	    if (existingCompany) {
	      logger.warn(`Company registration attempt with existing email: ${email}`);
	      return res.status(409).json({ error: "Company with this email already exists" });
	    }

	    if (existingAdmin) {
	      logger.warn(`Admin registration attempt with existing email: ${email}`);
	      return res.status(409).json({ error: "An admin account with this email already exists" });
	    }

	    if (existingUser) {
	      logger.warn(`Company registration attempt with email already used by a user: ${email}`);
	      return res.status(409).json({ error: "A user account with this email already exists. Please use a different email for company registration." });
	    }

    // Generate verification OTP
    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create the company with enhanced security
	    const company = new Company({
	      name: name.trim(),
	      email: normalizedEmail,
	      password: password, // Let the model handle password hashing
	      description: description?.trim(),
	      phone: phone.trim(),
	      address: address.trim(),
      contactPerson: contactPerson.trim(),
      isVerified: false, // Require email verification
      verificationOtp,
      verificationOtpExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      loginAttempts: 0,
      lockUntil: null,
      roles: ['company']
    });

    await company.save();

    // Create admin for the company with separate credentials
    const admin = new Admin({
      name: contactPerson.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Let the model handle password hashing
      company: company._id,
      isVerified: false, // Require email verification
      verificationOtp,
      verificationOtpExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      loginAttempts: 0,
      lockUntil: null,
      twoFactorEnabled: false,
      roles: ['admin']
    });

    await admin.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationOtp, name);
      logger.info(`Verification email sent to ${email} for company ${name}`);
    } catch (emailError) {
      logger.error(`Failed to send verification email to ${email}: ${emailError.message}`);
      // Don't fail registration if email fails, but log it
    }

    logger.info(`Company registered successfully: ${name} (${email})`);

    res.status(201).json({
      message: "Company registered successfully! Please check your email for verification code.",
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
        requiresVerification: true
      }
    });
  } catch (err) {
    logger.error(`Company registration error for ${req.body.email}: ${err.message}`);
    res.status(500).json({ error: "Server error during company registration" });
  }
};

// Get all client messages (for admin to view)
export const getAllClientMessages = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const messages = await Message.find({
      $or: [
        { sender: companyId, senderModel: 'Company' },
        { receiver: companyId, receiverModel: 'Company' }
      ]
    })
      .populate('sender', 'name email company')
      .populate('receiver', 'name email company')
      .sort({ createdAt: -1 });

    res.json({
      messages,
      total: messages.length
    });
  } catch (error) {
    console.error('Get all client messages error:', error);
    res.status(500).json({ error: 'Failed to get client messages' });
  }
};

// Get messages for a specific client (for admin to view)
export const getClientMessages = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { clientId } = req.params;

    // Verify the client exists
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (!client.company || client.company.toString() !== companyId.toString()) {
      return res.status(403).json({ error: 'Access denied. Client does not belong to your company.' });
    }

    // Get all messages between this company and the client
    const messages = await Message.find({
      $or: [
        { sender: clientId, senderModel: 'User', receiver: companyId, receiverModel: 'Company' },
        { sender: companyId, senderModel: 'Company', receiver: clientId, receiverModel: 'User' }
      ]
    })
    .populate('sender', 'name email company')
    .populate('receiver', 'name email company')
    .sort({ createdAt: -1 });

    // Mark client->company messages as read for the company
    await Message.updateMany(
      { sender: clientId, receiver: companyId, receiverModel: 'Company', isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      client: {
        id: client._id,
        name: client.name,
        email: client.email
      },
      messages,
      total: messages.length
    });
  } catch (error) {
    console.error('Get client messages error:', error);
    res.status(500).json({ error: 'Failed to get client messages' });
  }
};

// Admin reply to client message
export const replyToClientMessage = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { clientId, content } = req.body;

    // Verify client exists
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (!client.company || client.company.toString() !== companyId.toString()) {
      return res.status(403).json({ error: 'Access denied. Client does not belong to your company.' });
    }

    // Create admin reply message
    const message = new Message({
      sender: companyId,
      senderModel: 'Company',
      receiver: clientId,
      receiverModel: 'User',
      content,
      messageType: 'company_to_client'
    });

    await message.save();
    await message.populate({ path: 'sender', select: 'name email', strictPopulate: false });
    await message.populate({ path: 'receiver', select: 'name email', strictPopulate: false });

    res.status(201).json({
      message: 'Reply sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Reply to client error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
};
