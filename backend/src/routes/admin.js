import express from 'express';
import { getDashboardStats, getRecentActivities, getAllClients, approveRegistration, updateClientStatus, getAllUsers, getAllUsersInDatabase, updateUserRole, deleteUser, updateUserStatus, updateUserCompany, createCompany, createAdmin, getAllCompanies, updateCompanyStatus, deleteCompany, getOnlineStats, getAllAdmins, registerCompany, verifyAdminOtp, verifyCompanyOtp, createClient, getAllClientMessages, getClientMessages, replyToClientMessage, getUserMonthlyDue, setUserMonthlyDue, getCompanyMonthlyDues, addUserMonthlyDueAdjustment, getCompanyJoinRequests, approveCompanyJoinRequest, rejectCompanyJoinRequest } from '../controllers/adminController.js';
import { authenticateToken, requireAdminOnly } from '../middleware/auth.js';

const router = express.Router();

// Company self-registration (public routes - no authentication required)
router.post('/register-company', registerCompany);
router.post('/verify-company-otp', verifyCompanyOtp);

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdminOnly);

// Temporary public routes for testing
router.get('/all-users', requireAdminOnly, getAllUsersInDatabase);
router.put('/users/:userId/company/:companyId', requireAdminOnly, updateUserCompany);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);
router.get('/users/:userId/monthly-due', getUserMonthlyDue);
router.post('/users/:userId/monthly-due', setUserMonthlyDue);
router.post('/users/:userId/monthly-due/adjustments', addUserMonthlyDueAdjustment);
router.get('/monthly-dues', getCompanyMonthlyDues);

// Company join requests (user -> company approval)
router.get('/join-requests', getCompanyJoinRequests);
router.post('/join-requests/:requestId/approve', approveCompanyJoinRequest);
router.post('/join-requests/:requestId/reject', rejectCompanyJoinRequest);

// Company management functions
router.post('/companies', requireAdminOnly, createCompany);
router.get('/companies', requireAdminOnly, getAllCompanies);
router.put('/companies/:companyId/status', requireAdminOnly, updateCompanyStatus);
router.delete('/companies/:companyId', requireAdminOnly, deleteCompany);

// Admin management functions
router.post('/admins', requireAdminOnly, createAdmin);
router.post('/admins/verify-otp', requireAdminOnly, verifyAdminOtp);
router.get('/admins', requireAdminOnly, getAllAdmins);

// Client management functions
router.post('/clients', requireAdminOnly, createClient);
router.get('/clients', getAllClients);
router.put('/clients/:clientId/status', updateClientStatus);

// Dashboard routes
router.get('/dashboard-stats', getDashboardStats);
router.get('/recent-activities', getRecentActivities);
router.get('/online-stats', getOnlineStats);

// Message management routes (admin viewing client messages)
router.get('/messages', getAllClientMessages);
router.get('/messages/:clientId', getClientMessages);
router.post('/messages/reply', replyToClientMessage);

export default router;
