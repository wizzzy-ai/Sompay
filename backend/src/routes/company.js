import express from 'express';
import {
  getDashboardStats,
  getRecentActivities,
  getAllClients,
  updateClientStatus,
	  getAllUsers,
	  removeUserFromCompany,
	  getUserMonthlyDue,
	  setUserMonthlyDue,
	  addUserMonthlyDueAdjustment,
	  getCompanyMonthlyDues,
	  getCompanyJoinRequests,
  approveCompanyJoinRequest,
  rejectCompanyJoinRequest
} from '../controllers/adminController.js';
import { authenticateToken, requireCompany } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireCompany);

// Company dashboard
router.get('/dashboard-stats', getDashboardStats);
router.get('/recent-activities', getRecentActivities);

// Clients
router.get('/clients', getAllClients);
router.put('/clients/:clientId/status', updateClientStatus);

	// Users (assigned to this company)
	router.get('/users', getAllUsers);
	router.delete('/users/:userId', removeUserFromCompany);
	router.get('/users/:userId/monthly-due', getUserMonthlyDue);
	router.post('/users/:userId/monthly-due', setUserMonthlyDue);
	router.post('/users/:userId/monthly-due/adjustments', addUserMonthlyDueAdjustment);
	router.get('/monthly-dues', getCompanyMonthlyDues);

// Join requests
router.get('/join-requests', getCompanyJoinRequests);
router.post('/join-requests/:requestId/approve', approveCompanyJoinRequest);
router.post('/join-requests/:requestId/reject', rejectCompanyJoinRequest);

export default router;
