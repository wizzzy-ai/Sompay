import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationOtp: {
    type: String
  },
  verificationOtpExpires: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  roles: [{
    type: String,
    enum: ['admin', 'company'],
    default: ['company']
  }],
  permissions: {
    canManageUsers: { type: Boolean, default: true },
    canManagePayments: { type: Boolean, default: true },
    canViewReports: { type: Boolean, default: true },
    canManageSettings: { type: Boolean, default: true }
  },
  lastLogin: {
    type: Date
  },
  lastSeenAt: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    currency: {
      type: String,
      default: 'NGN'
    },
    paymentMethods: [{
      type: String,
      enum: ['credit_card', 'bank_transfer', 'paypal', 'crypto'],
      default: ['credit_card']
    }]
  }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
companySchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
companySchema.methods.comparePassword = async function(candidatePassword) {
  if (this.isLocked) {
    throw new Error('Account is locked due to too many failed login attempts');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for account lock
companySchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});



// Increment login attempts
companySchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }
  return this.updateOne(updates);
};

// Reset login attempts on successful login
companySchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

// Index for efficient queries
companySchema.index({ name: 1 });
companySchema.index({ email: 1 });

const Company = mongoose.model('Company', companySchema);

export default Company;
