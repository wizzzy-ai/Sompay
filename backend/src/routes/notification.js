import express from 'express';
import {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationCount
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { getNotificationSettings, updateNotificationSettings } from '../controllers/notificationController.js';

const router = express.Router();

// Admin/company routes (may need additional admin middleware)
router.post('/create', createNotification);

// User routes (require authentication)
router.use(authenticateToken);
router.get('/', getNotifications);
router.put('/:notificationId/read', markNotificationAsRead);
router.put('/mark-all-read', markAllNotificationsAsRead);
router.get('/count', getNotificationCount);
router.get('/unread-count', getNotificationCount);
router.get('/notification-settings', authenticateToken, getNotificationSettings);
router.put('/notification-settings', authenticateToken, updateNotificationSettings);

export default router;
