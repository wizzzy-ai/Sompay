import winston from 'winston';
import userRoutes from './src/routes/user.js';
import messageRoutes from './src/routes/message.js';
import notificationRoutes from './src/routes/notification.js';
import authRoutes from './src/routes/auth.js';
import addressRoutes from './src/routes/address.js';
import paymentRoutes from './src/routes/payment.js';
import adminRoutes from './src/routes/admin.js';
import dashboardRoutes from './src/routes/dashboard.js';
import companyRoutes from './src/routes/company.js';
import { registerCompany } from './src/controllers/adminController.js';
import { seedDefaultAdmin } from './src/utils/seedDefaultAdmin.js';
import { seedDefaultPlans } from './src/utils/seedDefaultPlans.js';
import planRoutes from './src/routes/plans.js';
import chatbotRoutes from './src/routes/chatbot.js';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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



const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();

if (!process.env.JWT_ACCESS_SECRET) {
  // Auth will fail to mint/verify JWTs without this.
  // (Kept as warning so the server can still boot for non-auth endpoints.)
  console.warn('Warning: JWT_ACCESS_SECRET is not set. Login/protected routes will fail.');
}
const normalizeOrigin = (value) => String(value || '').trim().replace(/\/+$/, '');

const allowedOriginEntries = (
  process.env.FRONTEND_ORIGIN ||
  process.env.FRONTEND_URL ||
  'http://localhost:5173'
)
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  const safeOrigin = normalizeOrigin(origin);
  if (!safeOrigin) return true;

  if (allowedOriginEntries.includes(safeOrigin)) return true;

  // Support simple wildcard entries like "*.vercel.app"
  const host = (() => {
    try {
      return new URL(safeOrigin).hostname;
    } catch {
      return '';
    }
  })();
  if (!host) return false;

  return allowedOriginEntries.some((entry) => {
    if (!entry.startsWith('*.')) return false;
    const suffix = entry.slice(1); // ".vercel.app"
    return host.endsWith(suffix);
  });
};

app.use(cors({
	  origin: (origin, cb) => {
	    if (!origin) return cb(null, true);
	    if (isOriginAllowed(origin)) return cb(null, true);
	    return cb(null, false);
	  },
	  credentials: true,
	  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
	}));
app.use(helmet());
app.use(passport.initialize());
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

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { err });
  process.exit(1);
});

// Passport Configuration
const backendBaseUrl =
  process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${backendBaseUrl}/auth/google/callback`,
      },
      (accessToken, refreshToken, profile, done) => done(null, profile),
    ),
  );
} else {
  logger.warn('Google OAuth disabled: missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET');
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${backendBaseUrl}/auth/github/callback`,
      },
      (accessToken, refreshToken, profile, done) => done(null, profile),
    ),
  );
} else {
  logger.warn('GitHub OAuth disabled: missing GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
// Back-compat alias (some clients call /api/auth/*)
app.use('/api/auth', authRoutes);
app.use('/chatbot', chatbotRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/messages', messageRoutes);
app.use('/notifications', notificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/address', addressRoutes);
app.use('/payments', paymentRoutes);
app.use('/admin', adminRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/company', companyRoutes);
app.use('/api/company', companyRoutes);
app.use('/plans', planRoutes);
app.use('/api/plans', planRoutes);

// Public company registration route (creates company and admin)
app.post('/companies/register', registerCompany);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'PSP Backend API' });
});

// Connect to MongoDB
const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGO_URL ||
  'mongodb://localhost:27017/psp';
mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 })
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
