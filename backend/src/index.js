import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import paymentRoutes from './routes/payment.js';
import dashboardRoutes from './routes/dashboard.js';
import messageRoutes from './routes/message.js';
import addressRoutes from './routes/address.js';
import notificationRoutes from './routes/notification.js';
import adminRoutes from './routes/admin.js';
import companyRoutes from './routes/company.js';
import { seedDefaultAdmin } from './utils/seedDefaultAdmin.js';
import { seedDefaultPlans } from './utils/seedDefaultPlans.js';
import planRoutes from './routes/plans.js';

const app = express();

const allowedOriginPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/
];

// CORS FIRST (before helmet)
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isAllowed = allowedOriginPatterns.some((pattern) => pattern.test(origin));
    callback(isAllowed ? null : new Error(`CORS blocked for origin: ${origin}`), isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
}));

// Then helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/address', addressRoutes);
app.use('/notifications', notificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/messages', messageRoutes);
app.use('/api/messages', messageRoutes);
app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/company', companyRoutes);
app.use('/api/company', companyRoutes);
app.use('/plans', planRoutes);
app.use('/api/plans', planRoutes);

// Swagger docs
import swagger from './swagger.js';
swagger(app);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/psp';
mongoose.connect(MONGO_URI)
  .then(async () => {
	    await seedDefaultAdmin(console);
	    await seedDefaultPlans(console);
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ API Docs: http://localhost:${PORT}/api/docs`);
    });
  })
  .catch(err => console.error('MongoDB connection failed:', err));

export default app;
