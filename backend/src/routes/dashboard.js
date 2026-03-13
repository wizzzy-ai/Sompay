import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getStats, getRevenueChart } from '../controllers/dashboardController.js';

const router = express.Router();

// Get dashboard statistics (requires auth)
router.get('/stats', authenticateToken, getStats);

// Get revenue chart data (requires auth)
router.get('/revenue-chart', authenticateToken, getRevenueChart);

export default router;
