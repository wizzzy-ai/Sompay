import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

	const userSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  name: { type: String, required: true }, // Keep for compatibility, computed as firstName + lastName
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
  password: { type: String, required: function() { return !this.provider; } }, // Only required for non-OAuth users
  provider: { type: String }, // OAuth provider (google, github, etc.)
  providerId: { type: String }, // OAuth provider ID
  isVerified: { type: Boolean, default: false },
  verificationOtp: { type: String },
  roles: { type: [String], default: ['client'] },
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  notificationSettings: {
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
	  recentActivities: [{
	    action: { type: String, required: true },
	    timestamp: { type: Date, default: Date.now },
	  }],
	  lastSeenAt: { type: Date, default: null },
	}, { timestamps: true });

// Email lowercasing is handled in the controller

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password || this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$')) {
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index for efficient queries
userSchema.index({ company: 1 });

const User = mongoose.model('User', userSchema);

export default User;
