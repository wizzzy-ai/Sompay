import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCheck,
  Clock3,
  CreditCard,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import api from '../../api/axios';
import Loading from '../../components/Loading';
import './Notifications.css';

const getRequestErrorMessage = (error, fallbackText) => {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.code === 'ERR_NETWORK') {
    const browserOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
    if (!browserOnline) {
      return 'Your browser is offline. Reconnect and try again.';
    }

    return 'Unable to reach the notification service at http://localhost:5000.';
  }

  if (error?.message) {
    return error.message;
  }

  return fallbackText;
};

const toneConfig = {
  payment_status: {
    label: 'Payment',
    icon: CreditCard,
    tone: 'success'
  },
  admin_message: {
    label: 'Admin',
    icon: MessageSquareText,
    tone: 'info'
  },
  system: {
    label: 'System',
    icon: ShieldAlert,
    tone: 'warning'
  }
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Unknown time';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  if (Number.isNaN(date.getTime())) return 'Unknown time';

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
  });
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const response = await api.get('/notifications', {
        params: { limit: 50 }
      });

      setNotifications(response.data?.notifications || []);
    } catch (err) {
      setNotifications([]);
      setError(getRequestErrorMessage(err, 'Failed to load notifications.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const groupedSummary = useMemo(() => {
    return notifications.reduce(
      (acc, item) => {
        const type = item.type || 'system';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      { payment_status: 0, admin_message: 0, system: 0 }
    );
  }, [notifications]);

  const markAsRead = async (notificationId) => {
    const target = notifications.find((item) => item._id === notificationId);
    if (!target || target.isRead) return;

    setNotifications((prev) =>
      prev.map((item) =>
        item._id === notificationId
          ? { ...item, isRead: true, readAt: new Date().toISOString() }
          : item
      )
    );

    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (err) {
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notificationId
            ? { ...item, isRead: false, readAt: null }
            : item
        )
      );
      setError(getRequestErrorMessage(err, 'Failed to mark notification as read.'));
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    const snapshot = notifications;
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt || new Date().toISOString()
      }))
    );

    try {
      await api.put('/notifications/mark-all-read');
    } catch (err) {
      setNotifications(snapshot);
      setError(getRequestErrorMessage(err, 'Failed to mark all notifications as read.'));
    }
  };

  if (loading) {
    return (
      <div className="ntf-page">
        <div className="ntf-loading-shell">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="ntf-page">
      <div className="ntf-shell">
        <section className="ntf-hero">
          <div className="ntf-hero-copy">
            <div className="ntf-kicker">
              <Bell size={14} />
              <span>PSP Notification Center</span>
            </div>
            <h1>Notification Inbox</h1>
            <p>Track payment updates, operational messages, and account alerts from one clear workspace.</p>
          </div>

          <div className="ntf-hero-actions">
            <button type="button" className="ntf-btn ntf-btn-soft" onClick={() => fetchNotifications({ silent: true })} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'ntf-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button type="button" className="ntf-btn ntf-btn-primary" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <CheckCheck size={16} />
              Mark all read
            </button>
          </div>
        </section>

        {error ? <div className="ntf-alert">{error}</div> : null}

        <section className="ntf-stats">
          <article className="ntf-stat-card ntf-stat-main">
            <span>Unread</span>
            <strong>{unreadCount}</strong>
            <small>{notifications.length} total notifications</small>
          </article>
          <article className="ntf-stat-card">
            <span>Payments</span>
            <strong>{groupedSummary.payment_status}</strong>
            <small>Transaction-related updates</small>
          </article>
          <article className="ntf-stat-card">
            <span>Admin</span>
            <strong>{groupedSummary.admin_message}</strong>
            <small>Messages from operators</small>
          </article>
          <article className="ntf-stat-card">
            <span>System</span>
            <strong>{groupedSummary.system}</strong>
            <small>Platform and security alerts</small>
          </article>
        </section>

        <section className="ntf-panel">
          <div className="ntf-panel-head">
            <div>
              <h2>Recent Notifications</h2>
              <p>Open items stay highlighted until they are marked as read.</p>
            </div>
            <div className="ntf-panel-badge">
              <Clock3 size={15} />
              Latest first
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="ntf-empty">
              <Bell size={36} />
              <h3>No notifications yet</h3>
              <p>Your PSP account activity will appear here when new events are generated.</p>
            </div>
          ) : (
            <div className="ntf-list">
              {notifications.map((notification) => {
                const config = toneConfig[notification.type] || toneConfig.system;
                const Icon = config.icon;

                return (
                  <article
                    key={notification._id}
                    className={`ntf-item ntf-tone-${config.tone} ${notification.isRead ? 'is-read' : 'is-unread'}`}
                    onClick={() => markAsRead(notification._id)}
                  >
                    <div className="ntf-item-icon">
                      <Icon size={18} />
                    </div>

                    <div className="ntf-item-copy">
                      <div className="ntf-item-head">
                        <div>
                          <h3>{notification.title}</h3>
                          <p>{notification.message}</p>
                        </div>
                        <div className="ntf-item-meta">
                          <span className="ntf-type-pill">{config.label}</span>
                          <time>{formatRelativeTime(notification.createdAt)}</time>
                        </div>
                      </div>

                      <div className="ntf-item-footer">
                        <span className={`ntf-read-state ${notification.isRead ? 'is-read' : 'is-unread'}`}>
                          {notification.isRead ? 'Read' : 'Unread'}
                        </span>
                        {!notification.isRead ? <span className="ntf-dot" /> : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Notifications;
