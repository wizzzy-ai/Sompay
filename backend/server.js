import winston from 'winston';
import userRoutes from './src/routes/user.js';
import messageRoutes from './src/routes/message.js';
import notificationRoutes from './src/routes/notification.js';
import authRoutes from './src/routes/auth.js';
import addressRoutes from './src/routes/address.js';
import paymentRoutes from './src/routes/payment.js';
import adminRoutes from './src/routes/admin.js';
import dashboardRoutes from './src/routes/dashboard.js';
import { registerCompany } from './src/controllers/adminController.js';
import { seedDefaultAdmin } from './src/utils/seedDefaultAdmin.js';
import { seedDefaultPlans } from './src/utils/seedDefaultPlans.js';
import planRoutes from './src/routes/plans.js';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';

// import rateLimit from 'express-rate-limit';
// import { authenticateToken } from './src/middleware/auth.js';
// import { authLimiter } from './src/middleware/rateLimiter.js';
// import { Resend } from 'resend';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import Joi from 'joi';
// import User from './src/models/User.js';  
// import nodemailer from 'nodemailer';
// import sgTransport from 'nodemailer-sendgrid-transport';
// import crypto from 'crypto';
// import path from 'path';
// import fs from 'fs';
// import morgan from 'morgan';



dotenv.config();
const app = express();
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
}));
app.use(helmet());
// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'psp-backend' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Passport Configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/google/callback`
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/github/callback`
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/messages', messageRoutes);
app.use('/notifications', notificationRoutes);
app.use('/api/address', addressRoutes);
app.use('/payments', paymentRoutes);
app.use('/admin', adminRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/plans', planRoutes);
app.use('/api/plans', planRoutes);

// Public company registration route (creates company and admin)
app.post('/companies/register', registerCompany);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'PSP Backend API' });
});

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/psp';
mongoose.connect(mongoUri)
.then(async () => {
  logger.info('Connected to MongoDB');
  await seedDefaultAdmin(logger);
  await seedDefaultPlans(logger);
})
.catch(err => logger.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
