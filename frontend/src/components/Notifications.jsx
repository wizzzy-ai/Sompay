import { useState, useEffect } from 'react';
import axios from '../api/axios';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  setNotifications(prev => {
  if (!Array.isArray(prev)) return [];
  return prev.map(notif => ({
    ...notif,
    isRead: true,
    readAt: new Date()
  }));
});
  const markAllAsRead = async () => {
    try {
      await axios.put('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          isRead: true,
          readAt: new Date()
        }))
      );
    }
    catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? 'Yesterday' : `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return <div className="notifications-loading">Loading notifications...</div>;
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button className="mark-all-read-btn" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => !notification.isRead && markAsRead(notification._id)}
            >
              <div className="notification-content">
                <h4 className="notification-title">{notification.title}</h4>
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">
                  {formatTime(notification.createdAt)}
                </span>
              </div>
              {!notification.isRead && <div className="unread-indicator"></div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
