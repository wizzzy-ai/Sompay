const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../src/middleware/rateLimiter');
const { sendVerificationEmail } = require('../src/utils/emailService');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Generate tokens
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Register with email verification
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered.' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = new User({ name, email, passwordHash: password, verificationToken });
    await user.save();

    // Create profile
    const profile = new Profile({ userId: user._id });
    await profile.save();

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Verify email
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification token required.' });

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification token.' });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Login with verification check
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ error: 'Please verify your email before logging in.' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken();

    // Store refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.json({
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required.' });

    const user = await User.findOne({ refreshTokens: refreshToken });
    if (!user) return res.status(401).json({ error: 'Invalid refresh token.' });

    const accessToken = generateAccessToken(user._id);
    res.json({ accessToken });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      req.user.refreshTokens = req.user.refreshTokens.filter(token => token !== refreshToken);
      await req.user.save();
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
