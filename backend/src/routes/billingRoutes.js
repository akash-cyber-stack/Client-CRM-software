import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  plans,
  subscription,
  checkout,
  confirmPayment,
  activatePlan,
} from '../controllers/billingController.js';

const router = Router();

router.get('/plans', plans);
router.post('/confirm-payment', confirmPayment);
router.get('/subscription', authenticate, subscription);
router.post('/checkout', authenticate, authorize('SUPER_ADMIN'), checkout);
router.post('/activate', authenticate, authorize('SUPER_ADMIN'), activatePlan);

export default router;
