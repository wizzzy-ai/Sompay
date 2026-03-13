import express from 'express';
import { getPricingPlans } from '../controllers/planController.js';

const router = express.Router();

// Public: pricing plans
router.get('/pricing', getPricingPlans);

export default router;

