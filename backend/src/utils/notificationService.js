import Notification from '../models/Notification.js';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const formatMonthYear = ({ month, year }) => {
  const safeMonth = Number(month);
  const safeYear = Number(year);
  const monthName = MONTH_NAMES[safeMonth - 1] || `Month ${safeMonth}`;
  return `${monthName} ${safeYear}`;
};

export const createUserNotification = async ({
  userId,
  type,
  title,
  message,
  metadata = {},
  dedupeKey = null,
}) => {
  if (!userId) return null;
  if (!type || !title || !message) return null;

  if (dedupeKey) {
    const existing = await Notification.findOne({
      user: userId,
      'metadata.dedupeKey': String(dedupeKey),
    }).select('_id');
    if (existing) return existing;
  }

  const notification = await Notification.create({
    user: userId,
    type,
    title: String(title).slice(0, 120),
    message: String(message).slice(0, 500),
    metadata: {
      ...metadata,
      ...(dedupeKey ? { dedupeKey: String(dedupeKey) } : {}),
    },
  });

  return notification;
};

