const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: function() { return !this.provider; } },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationOtp: { type: String },
  refreshTokens: [{ type: String }],
  roles: { type: [String], default: ['user'] },
  provider: { type: String }, // 'google', 'github', etc.
  providerId: { type: String },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  recentActivities: [{ action: String, timestamp: { type: Date, default: Date.now } }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
