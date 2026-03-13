import express from 'express';
import { register, login, adminLogin, companyLogin, refresh, logout, verifyOtp, me, updateProfile, changePassword, resendOtp, resendAdminOtp, googleAuth, googleAuthCallback, githubAuth, githubAuthCallback } from '../controllers/authController.js';
import { authLimiter, passwordChangeLimiter } from '../middleware/rateLimiter.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and sends OTP for email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User's password
 *               confirmPassword:
 *                 type: string
 *                 description: Password confirmation
 *     responses:
 *       200:
 *         description: User registered successfully, OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Invalid input or user already exists
 *       500:
 *         description: Server error
 */
router.post("/register", authLimiter, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates user and returns access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *       400:
 *         description: Bad request - Invalid credentials
 *       403:
 *         description: Account not verified
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/login", authLimiter, login);

/**
 * @swagger
 * /api/auth/admin/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticates admin and returns access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *               password:
 *                 type: string
 *                 description: Admin's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     companyId:
 *                       type: string
 *                     companyName:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Bad request - Invalid credentials
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/admin/login", authLimiter, adminLogin);
router.post("/company/login", authLimiter, companyLogin);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generates a new access token using a valid refresh token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: New JWT access token
 *       401:
 *         description: Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post("/refresh", refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logs out the authenticated user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post("/logout", logout);

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify email with OTP
 *     description: Verifies user's email address using OTP code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP code
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token for auto-login
 *       400:
 *         description: Invalid OTP
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/verify", verifyOtp);
router.post("/resend-otp", resendOtp);

/**
 * @swagger
 * /api/auth/admin/resend-otp:
 *   post:
 *     summary: Resend admin verification OTP
 *     description: Resends a new verification OTP to admin's email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Admin already verified
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/admin/resend-otp", resendAdminOtp);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get authenticated user info
 *     description: Retrieves information about the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/me", authenticateToken, me);
router.put("/update-profile", authenticateToken, updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     description: Allows authenticated user to change their password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: User's current password
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: User's new password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Invalid input or incorrect current password
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put("/change-password", authenticateToken, passwordChangeLimiter, changePassword);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     description: Redirects to Google for authentication
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get("/google", googleAuth);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Handles Google OAuth callback and returns JWT token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                 user:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get("/google/callback", googleAuthCallback);

/**
 * @swagger
 * /api/auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     description: Redirects to GitHub for authentication
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to GitHub OAuth
 */
router.get("/github", githubAuth);

/**
 * @swagger
 * /api/auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     description: Handles GitHub OAuth callback and returns JWT token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                 user:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get("/github/callback", githubAuthCallback);

export default router;

