import { Router } from 'express';
import {
  listFollowUps,
  completeFollowUp,
  followUpDashboard,
} from '../controllers/followUpController.js';
import { authenticate, scopeToEmployee } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, scopeToEmployee);

router.get('/', listFollowUps);
router.get('/dashboard', followUpDashboard);
router.patch('/:id/complete', completeFollowUp);

export default router;
