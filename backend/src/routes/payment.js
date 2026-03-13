import express from 'express';
import {
  getClientPayments,
  initiatePayment,
  getAllPayments,
  getRecentPayments,
  getMyDue,
  getCompanyPaymentsSummary
} from '../controllers/paymentController.js';
import { authenticateToken, requireCompany } from '../middleware/auth.js';

const router = express.Router();

// Client routes
router.get('/history', authenticateToken, getClientPayments);
router.get('/due', authenticateToken, getMyDue);
router.post('/initiate', authenticateToken, initiatePayment);

// Admin routes (assuming authenticateToken is sufficient, add admin check if needed)
router.get('/all', authenticateToken, getAllPayments);
router.get('/recent', authenticateToken, getRecentPayments);

// Company routes
router.get('/company/summary', authenticateToken, requireCompany, getCompanyPaymentsSummary);

export default router;
