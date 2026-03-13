import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 8, // adjust
  message: { error: 'Too many requests, try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit password change attempts
  message: { error: 'Too many password change attempts, try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
