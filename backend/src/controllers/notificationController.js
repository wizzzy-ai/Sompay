import Notification from '../models/Notification.js';
import NotificationSettings from '../models/NotificationSettings.js';

export const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data } = req.body;

    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      metadata: data || {}
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
};

export const getNotificationSettings = async (req, res) => {
   try {
    const userId = req.user.id; // Assuming authenticateToken sets req.user
    // Fetch settings from DB (example with Mongoose)
    const settings = await NotificationSettings.findOne({ user: userId });
    res.json({ settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch notification settings' });
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { settings } = req.body;
    // Update settings in DB
    const updated = await NotificationSettings.findOneAndUpdate(
      { user: userId },
      { settings },
      { new: true, upsert: true }
    );
    res.json({ settings: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
};


    

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments({ user: userId });
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

export const getNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false
    });

    res.json({
      success: true,
      count: unreadCount
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification count'
    });
  }
};
