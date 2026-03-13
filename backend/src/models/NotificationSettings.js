// File: src/models/NotificationSettings.js
import mongoose from 'mongoose';

const notificationSettingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  settings: {
    email: {
      paymentReminders: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
      accountUpdates: { type: Boolean, default: true },
    },
    push: {
      paymentDue: { type: Boolean, default: true },
      newFeatures: { type: Boolean, default: false },
      securityAlerts: { type: Boolean, default: true },
      accountUpdates: { type: Boolean, default: true },
    },
    sms: {
      securityAlerts: { type: Boolean, default: true },
      importantUpdates: { type: Boolean, default: true },
      paymentDue: { type: Boolean, default: false },
    },
  },
}, { timestamps: true });

const NotificationSettings = mongoose.model('NotificationSettings', notificationSettingsSchema);

export default NotificationSettings;
