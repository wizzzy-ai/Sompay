import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import passport from 'passport';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Company from '../models/Company.js';
import winston from 'winston';
import { sendVerificationEmail } from '../utils/emailService.js';

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'auth.log', level: 'info' }),
    new winston.transports.File({ filename: 'auth-error.log', level: 'error' }),
  ],
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/)        // uppercase
    .pattern(/[a-z]/)        // lowercase
    .pattern(/[0-9]/)        // number
    .pattern(/[^a-zA-Z0-9]/) // special char
    .required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')),
});

export const register = async (req, res) => {
	  try {
	    const { name, email, password } = req.body;
	    const normalizedEmail = String(email || '').toLowerCase().trim();

	    // Split name into firstName and lastName
	    const nameParts = name.trim().split(' ');
	    const firstName = nameParts[0] || '';
	    const lastName = nameParts.slice(1).join(' ') || '';

	    const [existingUser, existingCompany, existingAdmin] = await Promise.all([
	      User.findOne({ email: normalizedEmail }),
	      Company.findOne({ email: normalizedEmail }),
	      Admin.findOne({ email: normalizedEmail }),
	    ]);
	    if (existingUser) return res.status(400).json({ error: "User already exists" });
	    if (existingCompany) return res.status(409).json({ error: "This email belongs to a company account. Please use Company Login." });
	    if (existingAdmin) return res.status(409).json({ error: "This email belongs to an admin account. Please use Admin Login." });

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedPassword = await bcrypt.hash(password, 12);

	    const user = await User.create({
	      firstName,
	      lastName,
	      name: `${firstName} ${lastName}`,
	      email: normalizedEmail,
	      password: hashedPassword,
	      isVerified: false,
	      verificationOtp: otp,
	      company: null // Users can register without a company initially
	    });

    // log OTP in console for testing
    console.log(`OTP for ${email}: ${otp}`);

    // send OTP via Gmail SMTP (don't fail registration if email fails)
    try {
      await sendVerificationEmail(email, otp, name);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Continue with registration even if email fails
    }

    res.json({ message: "User created. Check your email for OTP." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
		  const normalizedEmail = String(req.body?.email || '').toLowerCase().trim();

	  const [companyAccount, adminAccount] = await Promise.all([
	    Company.findOne({ email: normalizedEmail }).select('_id email'),
	    Admin.findOne({ email: normalizedEmail }).select('_id email'),
	  ]);

	  if (companyAccount) return res.status(403).json({ error: "Please use Company Login for this email" });
	  if (adminAccount) return res.status(403).json({ error: "Please use Admin Login for this email" });

		  const user = await User.findOne({ email: normalizedEmail });
		  if (!user) return res.status(404).json({ error: "User not found" });

	  if (!user.isVerified) return res.status(403).json({ error: "Account not verified" });
	  if (user.status === 'inactive') return res.status(403).json({ error: "Account suspended" });

	  const match = await bcrypt.compare(req.body.password, user.password);
	  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const accessToken = jwt.sign(
    { id: user._id, userType: 'user' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  res.json({ accessToken, user: { id: user._id, name: `${user.firstName} ${user.lastName}`, email: user.email, roles: user.roles } });
};

export const adminLogin = async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const { password, otp } = req.body;

    // Prevent company accounts from using the admin login page.
    // Company self-registration creates both Company + Admin records with the same email/password,
    // but companies must authenticate via /auth/company/login and use the company portal.
    const companyAccount = await Company.findOne({ email }).select('_id');
    if (companyAccount) {
      return res.status(403).json({ error: 'Please use Company Login for this email.' });
    }

    // Admin login should authenticate only Admin accounts (platform admins / legacy admins).
    const admin = await Admin.findOne({ email }).populate('company');

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    // Check if admin is verified
    if (!admin.isVerified) return res.status(403).json({ error: "Admin account not verified" });
    if (admin.isActive === false) return res.status(403).json({ error: "Admin account suspended" });

    const match = await admin.comparePassword(password);
    if (!match) {
      await admin.incLoginAttempts();
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify 2FA OTP if enabled
    if (admin.twoFactorEnabled) {
      if (!otp) return res.status(400).json({ error: "OTP required for 2FA" });
      if (admin.twoFactorOtp !== otp || admin.twoFactorOtpExpires < Date.now()) {
        return res.status(401).json({ error: "Invalid or expired OTP" });
      }
      // Clear OTP after use
      admin.twoFactorOtp = null;
      admin.twoFactorOtpExpires = null;
    }

    await admin.resetLoginAttempts();

    const accessToken = jwt.sign(
      { id: admin._id, userType: 'admin' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      accessToken,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        companyId: admin.company?._id || null,
        companyName: admin.company?.name || null,
        roles: ['admin']
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const companyLogin = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();

    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ error: "Company not found" });
    if (company.isActive === false) return res.status(403).json({ error: "Company account suspended" });

    const match = await company.comparePassword(req.body.password);
    if (!match) {
      await company.incLoginAttempts();
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await company.resetLoginAttempts();

    const accessToken = jwt.sign(
      { id: company._id, userType: 'company', companyId: company._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      accessToken,
      user: {
        id: company._id,
        name: company.name,
        email: company.email,
        companyId: company._id,
        companyName: company.name,
        roles: company.roles || ['company']
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const enable2FA = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    admin.twoFactorEnabled = true;
    await admin.save();

    res.json({ message: "2FA enabled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const generate2FAOtp = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.twoFactorOtp = otp;
    admin.twoFactorOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await admin.save();

    // Send OTP via email
    if (resend) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: admin.email,
        subject: "Your 2FA OTP",
        html: `<h2>Your 2FA Code</h2><p>${otp}</p><p>This code expires in 10 minutes.</p>`
      });
    }

    res.json({ message: "2FA OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const refresh = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    let user;
    let userType = decoded.userType;

    if (userType === 'admin') {
      // First try to find in Company model (companies are now admins)
      user = await Company.findById(decoded.id);
      if (!user) {
        // Fallback to legacy Admin model
        user = await Admin.findById(decoded.id);
        if (!user) return res.status(404).json({ error: 'Admin not found' });
      }
    } else if (userType === 'company') {
      // Handle company token refresh
      user = await Company.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'Company not found' });
    } else {
      // Handle regular user token refresh
      user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      userType = 'user';
    }

    const newAccessToken = jwt.sign(
      { id: user._id, userType: userType },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const logout = async (req, res) => {
  res.json({ message: 'Logged out' });
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.verificationOtp !== otp)
      return res.status(400).json({ error: "Invalid OTP" });

    user.isVerified = true;
    user.verificationOtp = null; // clear OTP
    await user.save();

    // Generate access token for auto-login
    const accessToken = jwt.sign(
      { id: user._id, userType: 'user' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ message: "Account verified successfully", accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

	export const me = async (req, res) => {
	  try {
	    let user;

	    if (req.user.userType === 'admin') {
	      user = await Admin.findById(req.user.id).populate('company').select('-password');
	      if (!user) return res.status(404).json({ error: "Admin not found" });

	      user = {
	        id: user._id,
	        name: user.name,
	        email: user.email,
	        companyId: user.company?._id || null,
	        companyName: user.company?.name || null,
	        roles: ['admin']
	      };
	    } else if (req.user.userType === 'company') {
	      // Handle company user
	      user = await Company.findById(req.user.id).select('-password');
	      if (!user) return res.status(404).json({ error: "Company not found" });

      user = {
        id: user._id,
        name: user.name,
        email: user.email,
        companyId: user._id,
        companyName: user.name,
        roles: user.roles || ['company']
      };
    } else {
      // Handle regular user
      user = await User.findById(req.user.id).populate('company', 'name').select('-password');
      if (!user) return res.status(404).json({ error: "User not found" });
      user = {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || '',
        status: user.status,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        companyId: user.company?._id || null,
        companyName: user.company?.name || null,
        roles: user.roles
      };
    }

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const trimmedName = String(name).trim();
    const trimmedPhone = phone ? String(phone).trim() : '';

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousName = user.name;
    const previousPhone = user.phone || '';

    const nameParts = trimmedName.split(/\s+/);
    user.firstName = nameParts[0] || trimmedName;
    user.lastName = nameParts.slice(1).join(' ');
    user.name = trimmedName;
    user.phone = trimmedPhone;

    if (
      previousName !== user.name ||
      previousPhone !== user.phone
    ) {
      user.recentActivities.push({ action: 'Profile updated' });
      user.recentActivities = user.recentActivities.slice(-10);
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        status: user.status,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isVerified) return res.status(400).json({ error: "User already verified" });

    // generate a new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOtp = otp;
    await user.save();

    // log OTP in console for testing
    console.log(`Resent OTP for ${email}: ${otp}`);

    // send new OTP via Gmail SMTP
    try {
      await sendVerificationEmail(email, otp, user.name);
    } catch (emailError) {
      console.error('Failed to resend OTP email:', emailError);
      // Continue with resend even if email fails
    }

    res.json({ message: "A new OTP has been sent to your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const resendAdminOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    if (admin.isVerified) return res.status(400).json({ error: "Admin already verified" });

    // generate a new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.verificationOtp = otp;
    admin.verificationOtpExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await admin.save();

    // log OTP in console for testing
    console.log(`Resent OTP for admin ${email}: ${otp}`);

    // send new OTP via email if configured
    if (resend) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Your New Admin Verification OTP",
        html: `<h2>Your New Admin Verification Code</h2><p>${otp}</p><p>This code expires in 24 hours.</p><p>Please use this code to verify your admin account.</p>`
      });
    }

    res.json({ message: "A new verification code has been sent to your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/[A-Z]/)        // uppercase
    .pattern(/[a-z]/)        // lowercase
    .pattern(/[0-9]/)        // number
    .pattern(/[^a-zA-Z0-9]/) // special char
    .required(),
});

export const changePassword = async (req, res) => {
  try {
    const authUserId = req.user?.id || req.user?.userId;

    // Validate input
    const { error } = changePasswordSchema.validate(req.body);
    if (error) {
      logger.warn(`Password change validation failed for user ${authUserId}: ${error.details[0].message}`);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(authUserId);
    if (!user) {
      logger.warn(`Password change attempted for non-existent user: ${authUserId}`);
      return res.status(404).json({ error: "User not found" });
    }

    // Check if current password is correct
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      logger.warn(`Failed password change attempt for user ${user.email}: incorrect current password`);
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      logger.warn(`Password change attempt with same password for user ${user.email}`);
      return res.status(400).json({ error: "New password must be different from current password" });
    }

    // Hash the new password with higher cost factor for better security
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update the password
    user.password = hashedNewPassword;
    user.updatedAt = new Date();
    user.recentActivities.push({ action: 'Password changed' });
    user.recentActivities = user.recentActivities.slice(-10); // keep last 10 activities
    await user.save();

    // Log successful password change
    logger.info(`Password successfully changed for user: ${user.email}`);

    // Send notification email (optional)
    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: "Password Changed Successfully",
          html: `<h2>Password Changed</h2><p>Your password has been successfully changed. If you did not make this change, please contact support immediately.</p><p>Time: ${new Date().toISOString()}</p>`
        });
      } catch (emailError) {
        logger.error(`Failed to send password change notification email to ${user.email}: ${emailError.message}`);
        // Don't fail the request if email fails
      }
    }

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    logger.error(`Password change error for user ${req.user.id}: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

// Social Login Controllers
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

export const googleAuthCallback = (req, res) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err || !user) {
      logger.error('Google OAuth error:', err);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }

    try {
      // Extract email from Google profile (it might be in user.emails[0].value)
      const email = user.email || (user.emails && user.emails[0] && user.emails[0].value);

      if (!email) {
        logger.error('Google OAuth error: No email found in profile');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
      }

      // Find or create user
      let existingUser = await User.findOne({ email: email.toLowerCase() });

      if (!existingUser) {
        // Split name into firstName and lastName
        const nameParts = user.displayName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Create new user
        existingUser = await User.create({
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          email: email.toLowerCase(),
          isVerified: true, // Social logins are pre-verified
          provider: 'google',
          providerId: user.id,
          roles: ['user']
        });
        logger.info(`New user created via Google OAuth: ${email}`);
      } else {
        // Update provider info if not set
        if (!existingUser.provider) {
          existingUser.provider = 'google';
          existingUser.providerId = user.id;
          await existingUser.save();
        }
      }

      // Generate JWT token
      const accessToken = jwt.sign(
        { id: existingUser._id, userType: 'user' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
      );

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${accessToken}&user=${encodeURIComponent(JSON.stringify({
        id: existingUser._id,
        name: `${existingUser.firstName} ${existingUser.lastName}`,
        email: existingUser.email,
        roles: existingUser.roles
      }))}`);
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  })(req, res);
};

export const githubAuth = passport.authenticate('github', {
  scope: ['user:email']
});

export const githubAuthCallback = (req, res) => {
  passport.authenticate('github', { session: false }, async (err, user, info) => {
    if (err || !user) {
      logger.error('GitHub OAuth error:', err);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=github_auth_failed`);
    }

    try {
      // Extract email from GitHub profile (it might be in user.emails[0].value)
      const email = user.email || (user.emails && user.emails[0] && user.emails[0].value);

      if (!email) {
        logger.error('GitHub OAuth error: No email found in profile');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=github_auth_failed`);
      }

      // Find or create user
      let existingUser = await User.findOne({ email: email.toLowerCase() });

      if (!existingUser) {
        // Split name into firstName and lastName
        const displayName = user.displayName || user.username;
        const nameParts = displayName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Create new user
        existingUser = await User.create({
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          email: email.toLowerCase(),
          isVerified: true, // Social logins are pre-verified
          provider: 'github',
          providerId: user.id,
          roles: ['user']
        });
        logger.info(`New user created via GitHub OAuth: ${email}`);
      } else {
        // Update provider info if not set
        if (!existingUser.provider) {
          existingUser.provider = 'github';
          existingUser.providerId = user.id;
          await existingUser.save();
        }
      }

      // Generate JWT token
      const accessToken = jwt.sign(
        { id: existingUser._id, userType: 'user' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
      );

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${accessToken}&user=${encodeURIComponent(JSON.stringify({
        id: existingUser._id,
        name: `${existingUser.firstName} ${existingUser.lastName}`,
        email: existingUser.email,
        roles: existingUser.roles
      }))}`);
    } catch (error) {
      logger.error('GitHub OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  })(req, res);
};
