import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import bcrypt from 'bcryptjs';
import CompanyJoinRequest from '../models/CompanyJoinRequest.js';

const requireUser = (req, res, next) => {
  if (req.user?.userType !== 'user') {
    return res.status(403).json({ error: 'User access only' });
  }
  next();
};

const DEFAULT_NOTIFICATION_SETTINGS = {
  email: {
    paymentReminders: true,
    securityAlerts: true,
    marketingEmails: false,
    accountUpdates: true,
  },
  push: {
    paymentDue: true,
    newFeatures: false,
    securityAlerts: true,
    accountUpdates: true,
  },
  sms: {
    securityAlerts: true,
    importantUpdates: true,
    paymentDue: false,
  },
};

const normalizeNotificationSettings = (settings) => {
  const next = {
    email: { ...DEFAULT_NOTIFICATION_SETTINGS.email },
    push: { ...DEFAULT_NOTIFICATION_SETTINGS.push },
    sms: { ...DEFAULT_NOTIFICATION_SETTINGS.sms },
  };

  if (!settings || typeof settings !== 'object') return next;

  for (const channel of ['email', 'push', 'sms']) {
    const channelSettings = settings[channel];
    if (!channelSettings || typeof channelSettings !== 'object') continue;

    for (const [key, value] of Object.entries(channelSettings)) {
      if (Object.prototype.hasOwnProperty.call(next[channel], key) && typeof value === 'boolean') {
        next[channel][key] = value;
      }
    }
  }

  return next;
};

const normalizeCompany = (company) => ({
  id: company._id,
  name: company.name,
  description: company.description || null,
  address: company.address || null,
});

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieves the profile information of the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/me', authenticateToken, requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -verificationOtp');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * @swagger
 * /api/user/me:
 *   put:
 *     summary: Update user profile
 *     description: Updates the name of the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name for the user
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Name is required
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.put('/me', authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  await User.findByIdAndUpdate(req.user.id, { name }, { new: true });
  res.json({ message: 'Updated' });
});

/**
 * @swagger
 * /api/user/me/password:
 *   put:
 *     summary: Change user password
 *     description: Updates the password for the authenticated user after verifying the current password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password for verification
 *               newPassword:
 *                 type: string
 *                 description: New password to set
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Missing fields or incorrect current password
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.put('/me/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });
  const user = await User.findById(req.user.id);
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Current password incorrect' });
  const hash = await bcrypt.hash(newPassword, 12);
  user.passwordHash = hash;
  await user.save();
  res.json({ message: 'Password updated' });
});

/**
 * @swagger
 * /api/user/activity:
 *   get:
 *     summary: Get user recent activity
 *     description: Retrieves recent activities for the authenticated user including payments and notifications
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of activities to return
 *     responses:
 *       200:
 *         description: Activities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Unique activity identifier
 *                       type:
 *                         type: string
 *                         enum: [payment, notification]
 *                         description: Type of activity
 *                       title:
 *                         type: string
 *                         description: Activity title
 *                       description:
 *                         type: string
 *                         description: Detailed activity description
 *                       time:
 *                         type: string
 *                         format: date-time
 *                         description: When the activity occurred
 *                       icon:
 *                         type: string
 *                         enum: [success, warning, info]
 *                         description: Icon type for UI display
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Get recent payments
    const Transaction = (await import('../models/Transaction.js')).default;
    const recentPayments = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('amount status createdAt');

    // Get recent notifications
    const Notification = (await import('../models/Notification.js')).default;
    const recentNotifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title message type createdAt');

    // Combine and sort by date
    const activities = [];

    // Add payments as activities
    recentPayments.forEach(payment => {
      activities.push({
        id: `payment-${payment._id}`,
        type: 'payment',
        title: payment.status === 'paid' ? 'Payment Successful' : 'Payment Pending',
        description: `Payment of ₦${payment.amount} ${payment.status}`,
        time: payment.createdAt,
        icon: payment.status === 'paid' ? 'success' : 'warning'
      });
    });

    // Add notifications as activities
    recentNotifications.forEach(notification => {
      activities.push({
        id: `notification-${notification._id}`,
        type: 'notification',
        title: notification.title,
        description: notification.message,
        time: notification.createdAt,
        icon: notification.type === 'success' ? 'success' : notification.type === 'warning' ? 'warning' : 'info'
      });
    });

    // Sort by time (most recent first) and limit
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedActivities = activities.slice(0, limit);

    res.json({ activities: limitedActivities });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

/**
 * @swagger
 * /api/user/notification-settings:
 *   get:
 *     summary: Get user notification settings
 *     description: Retrieves the notification settings for the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: object
 *                     push:
 *                       type: object
 *                     sms:
 *                       type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/notification-settings', authenticateToken, requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationSettings');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ settings: user.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

/**
 * @swagger
 * /api/user/notification-settings:
 *   put:
 *     summary: Update user notification settings
 *     description: Updates the notification settings for the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: object
 *                   push:
 *                     type: object
 *                   sms:
 *                     type: object
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Invalid settings
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.put('/notification-settings', authenticateToken, requireUser, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'Settings required' });

    const nextSettings = normalizeNotificationSettings(settings);
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { notificationSettings: nextSettings },
      { new: true }
    ).select('notificationSettings');

    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Notification settings updated successfully', settings: updated.notificationSettings });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Company directory + join requests (user must be authenticated)
router.get('/companies', authenticateToken, requireUser, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const filter = { isActive: true, isVerified: true };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const companies = await Company.find(filter)
      .sort({ name: 1 })
      .limit(200)
      .select('name description address');

    res.json({ companies: companies.map(normalizeCompany) });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.get('/company-join-request', authenticateToken, requireUser, async (req, res) => {
  try {
    const latest = await CompanyJoinRequest.findOne({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('company', 'name description address');

    if (!latest) return res.json({ request: null });

    res.json({
      request: {
        id: latest._id,
        status: latest.status,
        message: latest.message || null,
        company: latest.company ? normalizeCompany(latest.company) : null,
        createdAt: latest.createdAt,
        decidedAt: latest.decidedAt,
      }
    });
  } catch (error) {
    console.error('Error fetching join request:', error);
    res.status(500).json({ error: 'Failed to fetch join request' });
  }
});

router.post('/company-join-requests', authenticateToken, requireUser, async (req, res) => {
  try {
    const { companyId, message } = req.body || {};
    if (!companyId) return res.status(400).json({ error: 'companyId is required' });

    const user = await User.findById(req.user.id).select('company');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.company) {
      return res.status(400).json({ error: 'You are already assigned to a company. Contact support/admin to change.' });
    }

    const company = await Company.findById(companyId).select('isActive isVerified');
    if (!company || !company.isActive || !company.isVerified) {
      return res.status(404).json({ error: 'Company not available' });
    }

    const existingPending = await CompanyJoinRequest.findOne({
      user: req.user.id,
      status: 'pending'
    });
    if (existingPending) {
      return res.status(400).json({ error: 'You already have a pending request. Please wait for approval.' });
    }

    const request = await CompanyJoinRequest.create({
      user: req.user.id,
      company: companyId,
      status: 'pending',
      message: message ? String(message).slice(0, 500) : null,
    });

    res.json({
      message: 'Request submitted',
      request: {
        id: request._id,
        status: request.status,
        createdAt: request.createdAt,
      }
    });
  } catch (error) {
    console.error('Error creating join request:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

export default router;
