const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  settings: Joi.object({
    notifications: Joi.boolean(),
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required(),
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    const profile = await Profile.findOne({ userId: req.user._id });
    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Update profile
router.patch('/me/profile', authenticate, async (req, res) => {
  try {
    const { error } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, settings } = req.body;

    if (name) {
      req.user.name = name;
      await req.user.save();
    }

    if (settings) {
      await Profile.findOneAndUpdate({ userId: req.user._id }, { settings, updatedAt: Date.now() }, { upsert: true });
    }

    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Change password
router.patch('/me/password', authenticate, async (req, res) => {
  try {
    const { error } = changePasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { currentPassword, newPassword } = req.body;

    if (!(await req.user.comparePassword(currentPassword))) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    req.user.passwordHash = newPassword;
    await req.user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
